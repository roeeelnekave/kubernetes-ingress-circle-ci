#!/bin/env python3

import os
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def homepage():
    return render_template("homepage.html", content="Hello world")

if __name__ == '__main__':
    app.run(
        host=os.getenv('FLASK_IP', '0.0.0.0'),
        port=os.getenv('FLASK_PORT', 5001),
        debug=bool(os.getenv('FLASK_DEBUG', True))
    )
