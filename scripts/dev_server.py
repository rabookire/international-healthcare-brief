#!/usr/bin/env python3
"""Dependency-free static dev command for the supported managed preview."""
import argparse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
p=argparse.ArgumentParser()
p.add_argument('--host',default='0.0.0.0')
p.add_argument('--port',type=int,default=4173)
p.add_argument('--strictPort',action='store_true')
a=p.parse_args()
handler=partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parents[1]))
with ThreadingHTTPServer((a.host,a.port),handler) as server:
    server.serve_forever()
