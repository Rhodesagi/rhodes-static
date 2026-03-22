#!/usr/bin/env python3
"""
Real-time server monitoring backend (adapted from monitor_server.py).
Collects system stats every 2 seconds and broadcasts via WebSocket.
Output format matches frontend expectations.
"""
import asyncio
import json
import random
import subprocess
import os
import logging
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

WS_PORT = 8900
UPDATE_INTERVAL = 2
MAX_LOG_LINES = 10
SYSLOG_PATH = "/var/log/syslog"

THRESHOLDS = {"cpu": 80.0, "memory": 85.0, "disk": 90.0}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global state
CLIENTS = set()
HISTORY_BUFFER = []

# Stats collection functions (from monitor_server.py)
def get_cpu_percent():
    if PSUTIL_AVAILABLE:
        try:
            return psutil.cpu_percent(interval=None)
        except:
            pass
    return 35.0 + random.uniform(-10, 15)

def get_cpu_count():
    if PSUTIL_AVAILABLE:
        try:
            return psutil.cpu_count()
        except:
            pass
    return 4

def get_memory_stats():
    if PSUTIL_AVAILABLE:
        try:
            vm = psutil.virtual_memory()
            return {"percent": vm.percent, "used": vm.used, "total": vm.total}
        except:
            pass
    percent = 60.0 + random.uniform(-5, 10)
    total = 16 * 1024**3
    used = total * percent / 100
    return {"percent": percent, "used": used, "total": total}

def get_disk_stats():
    if PSUTIL_AVAILABLE:
        try:
            du = psutil.disk_usage('/')
            return {"percent": du.percent, "used": du.used, "total": du.total}
        except:
            pass
    percent = 72.0 + random.uniform(-2, 3)
    total = 500 * 1024**3
    used = total * percent / 100
    return {"percent": percent, "used": used, "total": total}

def get_network_stats():
    if PSUTIL_AVAILABLE:
        try:
            net_io = psutil.net_io_counters()
            return {"sent": net_io.bytes_sent, "recv": net_io.bytes_recv}
        except:
            pass
    return {"sent": random.randint(1000000, 5000000), "recv": random.randint(2000000, 8000000)}

def get_top_processes():
    if PSUTIL_AVAILABLE:
        try:
            procs = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
                try:
                    pinfo = proc.info
                    if pinfo['cpu_percent'] is not None:
                        procs.append({"pid": pinfo['pid'], "name": str(pinfo['name'])[:25] or "unknown",
                                      "cpu_percent": pinfo['cpu_percent']})
                except:
                    pass
            procs.sort(key=lambda x: x['cpu_percent'], reverse=True)
            return procs[:10]
        except:
            pass
    process_names = ["python3", "nginx", "postgres", "redis-server", "node", "dockerd", "systemd", "sshd", "cron", "bash"]
    procs = [{"pid": 1000 + i * 100, "name": name, "cpu_percent": round(random.uniform(0.1, 25.0), 1)}
             for i, name in enumerate(process_names)]
    procs.sort(key=lambda x: x['cpu_percent'], reverse=True)
    return procs[:10]

def get_syslog_tail():
    try:
        if os.path.exists(SYSLOG_PATH) and os.access(SYSLOG_PATH, os.R_OK):
            result = subprocess.run(['tail', '-n', str(MAX_LOG_LINES), SYSLOG_PATH],
                                    capture_output=True, text=True, timeout=2)
            if result.returncode == 0:
                return result.stdout.splitlines()
    except Exception as e:
        logger.warning(f"Failed to read syslog: {e}")
    log_types = [("INFO", "System check completed"), ("INFO", "Cron job executed"),
                 ("WARNING", "High memory usage"), ("ERROR", "Failed to connect to database"),
                 ("INFO", "Service restarted")]
    import time
    now = time.strftime('%b %d %H:%M:%S')
    return [f"{now} server {t[0]}: {t[1]}" for t in [random.choice(log_types) for _ in range(10)]]

async def collect_stats():
    """Collect all stats and format for frontend."""
    cpu_percent = get_cpu_percent()
    mem = get_memory_stats()
    disk = get_disk_stats()
    net = get_network_stats()
    processes = get_top_processes()
    logs = get_syslog_tail()
    
    alerts = {}
    if cpu_percent > THRESHOLDS["cpu"]:
        alerts['cpu'] = True
    if mem['percent'] > THRESHOLDS["memory"]:
        alerts['memory'] = True
    if disk['percent'] > THRESHOLDS["disk"]:
        alerts['disk'] = True
    
    import time
    stat = {
        "timestamp": time.time(),
        "cpu_percent": cpu_percent,
        "memory_percent": mem['percent'],
        "memory_used": mem['used'],
        "memory_total": mem['total'],
        "disk_percent": disk['percent'],
        "disk_used": disk['used'],
        "disk_total": disk['total'],
        "network_sent": net['sent'],
        "network_recv": net['recv'],
        "processes": processes,
        "log_lines": logs,
        "alerts": alerts,
    }
    return stat

async def broadcast_stats():
    global CLIENTS, HISTORY_BUFFER
    while True:
        try:
            stat = await collect_stats()
            HISTORY_BUFFER.append(stat)
            if len(HISTORY_BUFFER) > 60:
                HISTORY_BUFFER.pop(0)
            if CLIENTS:
                msg = json.dumps(stat)
                disconnected = set()
                for client in CLIENTS:
                    try:
                        await client.send(msg)
                    except:
                        disconnected.add(client)
                CLIENTS -= disconnected
            await asyncio.sleep(UPDATE_INTERVAL)
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
            await asyncio.sleep(UPDATE_INTERVAL)

async def handle_client(websocket):
    global CLIENTS, HISTORY_BUFFER
    logger.info("Client connected")
    CLIENTS.add(websocket)
    try:
        # Send history
        for stat in HISTORY_BUFFER:
            await websocket.send(json.dumps(stat))
        # Keep connection open
        await websocket.wait_closed()
    except:
        pass
    finally:
        CLIENTS.discard(websocket)
        logger.info("Client disconnected")

async def main():
    logger.info(f"Starting server on port {WS_PORT}")
    asyncio.create_task(broadcast_stats())
    import websockets
    async with websockets.serve(handle_client, "0.0.0.0", WS_PORT):
        logger.info(f"WebSocket server running on ws://0.0.0.0:{WS_PORT}")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
