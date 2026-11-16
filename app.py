import time

from flask import Flask, jsonify, render_template

app = Flask(__name__)


def server_time():
    """Aktualni cas serveru: unix timestamp a stenove casy HH:MM:SS."""
    return {
        "unix": time.time(),
        "wall": time.strftime("%H:%M:%S"),
    }


@app.route("/")
def index():
    """Uvodni strana s analogovymi hodinami zobrazujicimi cas serveru."""
    return render_template("index.html", **server_time())


@app.route("/time")
def time_json():
    """Aktualni cas serveru jako JSON (pro prubeznou re-synchronizaci hodin)."""
    return jsonify(**server_time())


if __name__ == "__main__":
    app.run(debug=True)
