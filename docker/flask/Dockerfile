FROM python:3.12 as base

COPY requirements.txt /requirements.txt

RUN pip install --upgrade pip \
&& pip install -r /requirements.txt


FROM base

COPY . /app/

RUN cp /usr/share/zoneinfo/Europe/Berlin /etc/localtime \
&& apt-get update \
&& apt-get install -y curl gcc g++ make \
&& curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
&& apt-get install -y nodejs

WORKDIR /app

CMD ["gunicorn", "--workers=2", "--chdir=.", "--bind", "0.0.0.0:5001", "--access-logfile=-", "--error-logfile=-", "app:app"]


