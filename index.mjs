import Fastify from "fastify";
import fs from "fs";
import path from "path";
import net from "net";

const host  = '192.168.0.1'
const password = 'admin'
const statsOfIntrest = encodeURIComponent([
  "modem_main_state",
  "pin_status",
  "opms_wan_mode",
  "loginfo",
  "new_version_state",
  "current_upgrade_state",
  "is_mandatory",
  "signalbar",
  "network_type",
  "network_provider",
  "ppp_status",
  "EX_SSID1",
  "ex_wifi_status",
  "EX_wifi_profile",
  "m_ssid_enable",
  "RadioOff",
  "simcard_roam",
  "lan_ipaddr",
  "station_mac",
  "battery_charging",
  "battery_pers",
  "battery_vol_percent",
  "battery_value",
  "spn_name_data",
  "spn_b1_flag",
  "spn_b2_flag",
  "realtime_tx_bytes",
  "realtime_rx_bytes",
  "realtime_time",
  "realtime_tx_thrpt",
  "realtime_rx_thrpt",
  "monthly_rx_bytes",
  "monthly_tx_bytes",
  "monthly_time",
  "date_month",
  "data_volume_limit_switch",
  "data_volume_limit_size",
  "data_volume_alert_percent",
  "data_volume_limit_unit",
  "roam_setting_option",
  "upg_roam_switch",
  "check_web_conflict",
  "wifi_coverage",
  "m_ssid_enable",
  "imei",
  "rssi",
  "rscp",
  "lte_rsrp",
  "imsi",
  "MAX_Access_num",
  "SSID1",
  "AuthMode",
  "WPAPSK1_encode",
  "m_SSID",
  "m_AuthMode",
  "m_HideSSID",
  "m_WPAPSK1_encode",
  "m_MAX_Access_num",
  "lan_ipaddr",
  "mac_address",
  "msisdn",
  "LocalDomain",
  "wan_ipaddr",
  "static_wan_ipaddr",
  "ipv6_wan_ipaddr",
  "ipv6_pdp_type",
  "pdp_type",
  "opms_wan_mode",
  "ppp_status",
  "network_type"
].join())

const encodedPassword = encodeURIComponent(Buffer.from(password).toString('base64'))

// fastify api
const fastify = Fastify();
fastify.get("/", async (request, reply) => {
  const htmlPath = path.join(process.cwd(), "index.html");
  const html = fs.readFileSync(htmlPath, "utf-8");
  reply.type("text/html").send(html);
});
fastify.get("/api/status", async (request, reply) => {
  await login();
  reply.send(await getStatus());
});
fastify.post("/api/reboot", async (request, reply) => {
  await login();
  reply.send(await rebootDevice());
});


async function login() {
  const body = `isTest=false&goformId=LOGIN&password=${encodedPassword}`;

  return rawFetch({
    method: "POST",
    path: "/goform/goform_set_cmd_process",
    headers: {
      "Referer": "http://192.168.0.1/index.html",
      "Content-Length": Buffer.byteLength(body)
    },
    body
  });
}

async function getStatus() {
  return rawFetch({
    method: "GET",
    path: `/goform/goform_get_cmd_process?isTest=false&multi_data=1&cmd=${statsOfIntrest}`,
    headers: {
      "Referer": "http://192.168.0.1/index.html"
    }
  });
}

async function rebootDevice() {
  const body = "isTest=false&goformId=REBOOT_DEVICE";

  return rawFetch({
    method: "POST",
    path: "/goform/goform_set_cmd_process",
    headers: {
      "Referer": "http://192.168.0.1/index.html",
      "Content-Length": Buffer.byteLength(body)
    },
    body
  });
}

function rawFetch({ method, path, headers = {}, body = "" }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(80, host);
    let response = "";

    socket.on("connect", () => {
      const headerLines = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join("\r\n");
      socket.write(`${method} ${path} HTTP/1.1\r\nHost: ${host}\r\n${headerLines}\r\nConnection: close\r\n\r\n${body}`);
    });

    socket.on("data", chunk => {
      response += chunk.toString("utf8");
    });

    socket.on("end", () => resolve(JSON.parse(response.split("\n\n").slice(1).join("\n\n").trim())));

    socket.on("error", reject);
  });
}

await fastify.listen({ port: 8099 });
console.log("Server listening on http://localhost:8099");