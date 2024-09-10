# Setup Grafana and prometheus monitoring in kubernetes with flask inside and deploy using circle ci
# Prerequities
- 64-bit chip in your system
- minikube
- docker
- docker-compose
- python
- helm
- nodejs
- make

# Setup directories 
```bash
mkdir -p app/gulp/assets/{css,images,js}
mkdir -p app/gulp/assets/js/modules
mkdir -p docker/{flask,nginx}
mkdir -p kube
mkdir -p templates
```

# Setup grafana and promethues
- Run the following to setup helm
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

- Create the custom-values `touch ./kube/custom-values.yaml` and paste the following
```yaml
# custom-values.yaml
prometheus:
  service:
    type: NodePort
grafana:
  service:
    type: NodePort
```
- Then, install the kube-prometheus-stack using Helm run the following:

```bash
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack -f ./kube/custom-values.yaml
```

- Verify `kubectl get services`

<h2>Download images</h2>

<p>Run the following command to download an image that you'll display in the website</p>
<pre><code class="language-bash">wget https://blog.adobe.com/en/publish/2021/04/07/media_1460789842033a3aab3da4086a5abfd2326d59789.png -O app/gulp/assets/images/landscape.png
</code></pre>


<h2>Create Flask application</h2>

<p>As a first step, we'll create the flask application and once it is running we'll add all other functionalities</p>
<h3><code>./requirements.txt</code></h3>
<p>This is the file that stores the dependencies necessary for our small application</p><pre><code class="language-txt">click==8.0.3
Flask==2.0.2
gunicorn==20.1.0
itsdangerous==2.0.1
Jinja2==3.0.3
MarkupSafe==2.0.1
Werkzeug==2.0.2
</code></pre>

<h3><code>./app.py</code></h3>
<p>This is the main flask application that holds the rules for our website.</p><pre><code class="language-python">#!/bin/env python3

import os
from flask import Flask, render_template

app = Flask(__name__)

@app.route(&quot;/&quot;)
def homepage():
    return render_template(&quot;homepage.html&quot;, content=&quot;Hello world&quot;)

if __name__ == &#039;__main__&#039;:
    app.run(
        host=os.getenv(&#039;FLASK_IP&#039;, &#039;0.0.0.0&#039;),
        port=os.getenv(&#039;FLASK_PORT&#039;, 5000),
        debug=bool(os.getenv(&#039;FLASK_DEBUG&#039;, True))
    )
</code></pre>


<h3><code>./templates/homepage.html</code></h3>
<p>Let's just write a dummy html code that will be displayed by flask application. Don't worry about the missing css and js files yet. They'll be added later.</p><pre><code class="language-html">&lt;!doctype html&gt;
&lt;html lang=&quot;en&quot;&gt;
&lt;head&gt;
    &lt;meta charset=&quot;UTF-8&quot;&gt;
    &lt;meta name=&quot;viewport&quot;
          content=&quot;width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0&quot;&gt;
    &lt;meta http-equiv=&quot;X-UA-Compatible&quot; content=&quot;ie=edge&quot;&gt;
    &lt;title&gt;Document&lt;/title&gt;
    &lt;link rel=&quot;stylesheet&quot; href=&quot;/css/external.css&quot;&gt;
    &lt;link rel=&quot;stylesheet&quot; href=&quot;/css/app.css&quot;&gt;
&lt;/head&gt;
&lt;body&gt;

&lt;h1&gt;Hello world&lt;/h1&gt;
&lt;h3&gt;welcome to my page&lt;/h3&gt;

&lt;img src=&quot;/images/bmw-r-1250-gs.jpg&quot; width=&quot;500&quot; alt=&quot;BMW R1250GS&quot; /&gt;
&lt;img src=&quot;/images/bmw-r-1250-gs.jpg&quot; width=&quot;500&quot; alt=&quot;BMW R1250GS&quot; /&gt;
&lt;img src=&quot;/images/bmw-r-1250-gs.jpg&quot; width=&quot;500&quot; alt=&quot;BMW R1250GS&quot; /&gt;

&lt;script src=&quot;/js/external.js&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;/js/app.js&quot;&gt;&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
</code></pre>

<p>Before we run our application, we'll have to create a virtual environment:</p>
<pre><code class="language-bash">python3 -m venv myv
source myv/bin/activate
</code></pre>

<p>Then, let's install the dependencies for our little project:</p>
<pre><code class="language-bash">pip install -r requirements.txt
</code></pre>

<p>Now, let's start our project and view it in the browser:</p><pre><code class="language-bash">python app.py
</code></pre>

<p>Open the browser at url <a href="localhost:5000" title="localhost:5000">localhost:5000</a> and you should see the text from our html page,  but you won't be able to see the image displayed three times. </p>
<p>The reason why you don't see the colored text and images is that they are not existing in the <code>public</code> directory and you don't have any server configured to serve those files.  We'll configure nginx inside a docker container a little bit later.</p>
<h2>Create nodejs assets</h2>

<p>To compile the assets files (css, js and images) we'll use gulp and a small npm package that I wrote to make life easier when it comes to frontend dependencies: <a href="https://www.npmjs.com/package/kisphp-assets" title="kisphp-assets" target="_blank">kisphp-assets</a></p>
<p>If you haven't used gulp before, have a look at the <a href="https://gulpjs.com/docs/en/getting-started/quick-start" title="gulp documentation" target="_blank">gulp documentation</a>.</p>
<p>Create the following files:</p>
<h3><code>./app/gulp/gulpfile.js</code></h3>
<p>This will be the main gulpfile.js file where you configure what tasks you want to run by gulp for your project.</p><pre><code class="language-javascript">const { task, series } = require(&#039;gulp&#039;);

const config = require(&#039;../../gulp-config&#039;);

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

const js = require(&#039;kisphp-assets/tasks/javascripts&#039;)(config.js.external);
const bsrf = requireUncached(&#039;kisphp-assets/tasks/browserify&#039;)(config.js.project);
const css = require(&#039;kisphp-assets/tasks/css&#039;)(config.css.external);
const incss = requireUncached(&#039;kisphp-assets/tasks/css&#039;)(config.css.project);
const files = require(&#039;kisphp-assets/tasks/copy_files&#039;)(config.files);

task(&#039;default&#039;, series(
    files.copy_files,
    css.css,
    incss.css,
    js.javascripts,
    bsrf.browserify,
));
</code></pre>

<h3><code>./app/gulp/assets/css/main.css</code></h3>
<p>Just a small styling for your page so you can see how it interacts with your application</p><pre><code class="language-css">h1 {
    color: #9C1A1C;
}

h3 {
    color: #3A7734;
}
</code></pre>

<h3><code>./app/gulp/assets/js/modules/demo.js</code></h3>
<p>This js file will not do much, but it will show you how to add custom js code. All you have to do, is to create a file per use case  and have <code>init</code> function for the exported object. You also can create functions, classes or everything you need in that file.</p>
<p>The files will be compiled by gulp with browserify plugin.</p><pre><code class="language-javascript">module.exports = {
    init: function() {
        console.log(&#039;file loaded&#039;);
    }
}
</code></pre>

<h3><code>./app/gulp/assets/js/app.js</code></h3>
<p>Here is the main javascript file for your application and will load all modules inside a document.ready jquery object.</p><pre><code class="language-javascript">$(document).ready(function(){
    require(&#039;./modules/demo&#039;).init();
    // add here more files that do one thing (Single Responsibility Principle)
});
</code></pre>

<h3><code>./package.json</code></h3>
<p>Let's create the dependencies list for our assets </p><pre><code class="language-json">{
  &quot;scripts&quot;: {
    &quot;build&quot;: &quot;gulp --gulpfile app/gulp/gulpfile.js --cwd .&quot;
  },
  &quot;dependencies&quot;: {
    &quot;bootstrap&quot;: &quot;^5.1.3&quot;,
    &quot;jquery&quot;: &quot;^3.6.0&quot;,
    &quot;kisphp-assets&quot;: &quot;^0.6.0&quot;
  }
}
</code></pre>

<h3><code>./gulp-config.js</code></h3>
<p>The purpose of this file is to have the list for which files will be compiled by gulp tasks. You'll have the following configurations:</p><ul>
<li><strong>js.external</strong> -> combine external javascript dependencies and combine them all into one <code>external.js</code> file</li>
<li><strong>js.project</strong> -> local javascript files written in require.js format and compiled by browserify into one <code>app.js</code> file</li>
<li><strong>css.external</strong> -> combine external css dependencies and save them into one <code>external.css</code> file</li>
<li><strong>css.project</strong> -> build local css files and save them into <code>app.css</code> file. Here you can use <code>css</code>, <code>stylus</code> or <code>scss</code> sources.</li>
<li><strong>files.xxxx</strong> -> here is the definition of the files you want to copy from dependencies to public directory. Usually you will copy images and fonts.</li>
</ul>
<pre><code class="language-javascript">const settings = function(){
  this.root_path = __dirname;
  this.project_assets = __dirname + "/app/gulp/";

  this.settings = {
    "name": "kisphp demo",
    "root_path": this.root_path,
    "project_assets": this.project_assets,

    "js": {
      "external": {
        "sources": [
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/bootstrap/dist/js/bootstrap.min.js',
        ],
        "output_filename": "external.js",
        "output_dirname": "public/js/",
      },
      "project": {
        "sources": [
          this.project_assets + '/assets/js/app.js',
        ],
        "output_filename": "app.js",
        "output_dirname": "public/js/",
      }
    },
    "css": {
      "external": {
        "sources": [
          'node_modules/bootstrap/dist/css/bootstrap.min.css',
        ],
        "output_filename": "external.css",
        "output_dirname": "public/css/",
      },
      "project": {
        "sources": [
          this.project_assets + '/assets/css/main.css'
        ],
        "output_filename": "app.css",
        "output_dirname": "public/css/",
      }
    },
    "files": {
      "fonts": {
        "sources": [
          'node_modules/bootstrap/fonts/*.*',
        ],
        "output_dirname": "public/fonts"
      },
      "images": {
        "sources": [
          this.project_assets + '/assets/images/**/*.*'
        ],
        "output_dirname": "public/images"
      }
    }
  };

  return this.settings;
};

module.exports = settings();

</code></pre>

<p>Now that you have all these files created, let's install the dependencies:</p>
<pre><code class="language-bash">npm install
</code></pre>

<p>Then let's generate our public directory with all required files in it:</p>
<pre><code class="language-bash">npm run build
</code></pre>

<p>At this point, you should have a flask application and a generated <code>public</code> directory with two css files, two javascript files and one image</p>
<blockquote>Again, if you run <code>python app.py</code> you still won't be able to load the assets files and the image. We'll do this in the next step.</blockquote>
<h2>Create Docker configuration</h2>
<p>This file is optional but it will not add the generated directories into the docker context while you build the docker images</p><h3><code>.dockerignore</code></h3>
<pre><code class="language-ignore">myv
public
</code></pre>

<p>As you will see, I like to follow the convention of keeping the docker files inside the <code>docker</code> directory, even if I have one or mode docker images per project.  This helps me to have the projects a little bit more structured and clean.  </p>
<h3><code>./docker/flask/Dockerfile</code></h3>
<p>Let's create the dockerfile for the flask application. The installation of nodejs here is necessary only for the kubernetes use case which will be later.</p><pre><code class="language-dockerfile">FROM python:3.12 as base

COPY requirements.txt /requirements.txt

RUN pip install --upgrade pip \
&amp;&amp; pip install -r /requirements.txt


FROM base

COPY . /app/

RUN cp /usr/share/zoneinfo/Europe/Berlin /etc/localtime \
&amp;&amp; apt-get update \
&amp;&amp; apt-get install -y curl gcc g++ make \
&amp;&amp; curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
&amp;&amp; apt-get install -y nodejs

WORKDIR /app

CMD [&quot;gunicorn&quot;, &quot;--workers=2&quot;, &quot;--chdir=.&quot;, &quot;--bind&quot;, &quot;0.0.0.0:5000&quot;, &quot;--access-logfile=-&quot;, &quot;--error-logfile=-&quot;, &quot;app:app&quot;]

</code></pre>

<h3><code>./docker/nginx/Dockerfile</code></h3>
<p>This is the dockerfile for the nginx container</p><pre><code class="language-dockerfile">FROM node:20 as base

COPY . /app

WORKDIR /app

RUN npm install --no-interaction
RUN npm run build


FROM nginx

COPY --from=base /app/public /app/public

COPY docker/nginx/proxy.conf /etc/nginx/conf.d/default.conf

</code></pre>

<h3><code>./docker/nginx/proxy.conf</code></h3>
<p>This is the nginx configuration for our application</p><pre><code class="language-conf">server {
    listen 80;

    server_name _;

    location ~ \.(css|js|jpg|png|jpeg|webp|gif|svg) {
        root /app/public;
    }

    location / {
        proxy_set_header Host $host ;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto: http;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection &quot;upgrade&quot;;

        proxy_pass http://flask-app:5000;
        proxy_read_timeout 10;
    }
}
</code></pre>

<h3><code>./docker-compose.yml</code></h3>

<p>Here you configure your flask and nginx containers to work together and serve your application in the browser</p>
<pre><code class="language-yaml">version: &quot;3&quot;
services:
  flask-app:
    build:
      dockerfile: docker/flask/Dockerfile
      context: .
    ports:
      - 5000
    volumes:
      - ./:/app
      - ./public:/app/public

  flask-nginx:
    image: nginx
    volumes:
      - ./docker/nginx/proxy.conf:/etc/nginx/conf.d/default.conf
      - ./public:/app/public
    ports:
      - 80:80
</code></pre>

<p>Well, in this point, if you still have flask application running, press <strong>CTRL + C</strong> to stop it. </p>



<h2>Create kubernetes configuration</h2>

<p>Now, that we have the application running on local, let's configure kubernetes.</p>
<blockquote>For tests, we'll use minikube</blockquote>
<p>Start minikube</p>
<pre><code class="language-bash">minikube start
</code></pre>

<p>Make sure you have the following plugins installed and enabled:</p><ul>
<li>dns</li>
<li>ingress</li>
<li>registry</li>
<li>storage-provisioner</li>
<li>metrics-server</li>
</ul>

<p>List addons:</p>
<pre><code class="language-bash">minikube addons list
</code></pre>

<p>Enable plugins if they are not enabled already</p>
<pre><code class="language-bash">minikube addons enable registry 
minikube addons enable metrics-server 
minikube addons enable ingress 
minikube addons enable ingress-dns
minikube addons enable storage-provisioner
</code></pre>

<p>Let's go further and create our kubernetes manifests:</p>
<h3><code>./kube/deployment.yaml</code></h3>
<p>This is the deployment manifest where you configure the pods that will run the application.  In this setup, we'll create a pod with two containers (flask and nginx) and one initcontainer that will generate the fils in the public directory which will be defined as a shared volume between the containers.</p>
<pre><code class="language-yaml">apiVersion: apps/v1
kind: Deployment
metadata:
  name: flask
  labels:
    app: flask
spec:
  replicas: 2
  progressDeadlineSeconds: 120
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  selector:
    matchLabels:
      app: flask
  template:
    metadata:
      name: flask
      labels:
        app: flask
    spec:
      restartPolicy: Always
      containers:
        - name: flask
          image: localhost:5000/flask:__VERSION__
          imagePullPolicy: Always
          ports:
            - containerPort: 5000
          envFrom:
            - configMapRef:
                name: flask
          volumeMounts:
            - mountPath: /app/public
              name: public-dir
          livenessProbe:
            exec:
              command:
                - cat
                - /app/public/ready
            initialDelaySeconds: 5
            periodSeconds: 5
          readinessProbe:
            exec:
              command:
                - cat
                - /app/public/ready
            initialDelaySeconds: 5
            periodSeconds: 5
        - name: nginx
          image: nginx
          imagePullPolicy: Always
          ports:
            - containerPort: 80
          volumeMounts:
            - mountPath: /etc/nginx/conf.d
              name: nginx-config
            - mountPath: /app/public
              name: public-dir
          livenessProbe:
            exec:
              command:
                - cat
                - /app/public/ready
            initialDelaySeconds: 5
            periodSeconds: 5
          readinessProbe:
            exec:
              command:
                - cat
                - /app/public/ready
            initialDelaySeconds: 5
            periodSeconds: 5
      initContainers:
        - name: npm
          image: localhost:5000/flask:__VERSION__
          imagePullPolicy: Always
          workingDir: /app
          command:
            - bash
          args:
            - build.sh
          volumeMounts:
            - mountPath: /app/public
              name: public-dir
      volumes:
        - name: nginx-config
          configMap:
            name: flask-nginx
        - name: public-dir
          emptyDir: {}
</code></pre>


<h3><code>./kube/config-map.yaml</code></h3>
<p>We create two configurations maps. One for the flask application and one for the nginx container.  I think you have already noticed that in the deployment file, we don't use the a custom nginx container.  We could and that would have been easier, but let's do it like this so we don't create a docker image with static files.</p><pre><code class="language-yaml">apiVersion: v1
kind: ConfigMap
metadata:
  name: flask
  namespace: default
data:
  FLASK_PORT: &quot;5000&quot;
  FLASK_DEBUG: &quot;0&quot;
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: flask-nginx
  namespace: default
data:
  default.conf: |
    server {
        listen 80;

        server_name _;

        location ~ \.(css|js|jpg|png|jpeg|webp|gif|svg) {
            root /app/public;
        }

        location / {
            proxy_set_header Host $host ;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Proto: http;

            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection &quot;upgrade&quot;;

            proxy_pass http://127.0.0.1:5000;
            proxy_read_timeout 10;
        }
    }
</code></pre>


<h3><code>./kube/ingress.yaml</code></h3>
<p>The ingress configuration will be used to access our application in the browser under the <a href="http://dev.k8s/" title="http://dev.k8s/" target="_blank">http://dev.k8s/</a> url</p><pre><code class="language-yaml">apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: flask
  namespace: default
spec:
  rules:
    - host: dev.k8s
      http:
        paths:
          - path: /
            pathType: ImplementationSpecific
            backend:
              service:
                name: flask
                port:
                  number: 80

    - host: grafana.k8s
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: kube-prometheus-stack-grafana 
                port:
                  number: 80
    
</code></pre>
<h2>Postgresql</h2><br>
<h3><code>./kube/ps-claim.yaml</code></h3>
<p>Copy and paste the following to create postgres volume claim</p>
<pre><code class="language-yaml">
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-volume-claim
  labels:
    app: postgres
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
</code></pre><br>
To create a configmap
<h3><code>./kube/ps-configmap.yaml</code></h3>
<pre>
<code class="language-yaml">
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-secret
  labels:
    app: postgres
data:
  POSTGRES_DB: ps_db
  POSTGRES_USER: admin
  POSTGRES_PASSWORD: admin
</code>
</pre>
To create deployment
<h3><code>./kube/ps-deployment</code></h3>
<pre>
<code class="language-yaml">
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: 'postgres:16'
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5432
          envFrom:
            - configMapRef:
                name: postgres-secret
          volumeMounts:
            - mountPath: /var/lib/postgresql/data
              name: postgresdata
      volumes:
        - name: postgresdata
          persistentVolumeClaim:
            claimName: postgres-volume-claim

</code>
</pre>
To create a presistent volume use the following code
<h3><code>./kube/ps-pv.yaml</code></h3>
<pre><code class="language-yaml">
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-volume
  labels:
    type: local
    app: postgres
spec:
  storageClassName: manual
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteMany
  hostPath:
    path: /data/postgresql
</code></pre>
To create postgres service use the following code and file
<h3><code>./kube/ps-service.yaml</code></h3>
<pre><code class="language-yaml">
apiVersion: v1
kind: Service
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  type: NodePort
  ports:
    - port: 5432
  selector:
    app: postgres
</code></pre>
<p>For this run the following command in your terminal to add the minikube ip to your <code>/etc/hosts</code>:</p>
<pre><code class="language-bash">sudo bash -c &quot;echo \&quot;$(minikube ip) dev.k8s\&quot; &gt;&gt; /etc/hosts&quot;
</code></pre>

Also 
</p>
<pre><code class="language-bash">sudo bash -c &quot;echo \&quot;$(minikube ip) grafana.k8s\&quot; &gt;&gt; /etc/hosts&quot;
</code></pre>
<p>Then, if you run <code>cat /etc/hosts</code> you should see on the last line your minikube ip and <code>dev.k8s</code></p>
<h3><code>./kube/service.yaml</code></h3>
<p>We'll create a service of type <code>ClusterIP</code> for our application that will connect to the port <code>80</code> on the nginx container in the deployment pod. </p><pre><code class="language-yaml">apiVersion: v1
kind: Service
metadata:
  name: flask
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: flask
  ports:
    - port: 80
      targetPort: 80
</code></pre>

<p>For a better understanding of what happens here, when you make a request to the url <a href="http://dev.k8s/" title="http://dev.k8s/" target="_blank">http://dev.k8s/</a>, the browser will make a request to the minikube instance and will match the ingress with the url defined earlier which will connect to the <code>flask</code> service which will connect to the <code>nginx</code> container in the running pod of the flask application.</p>
<p>For the requests to the css, js or images files, nginx will directly deliver them, but for other types of requests, the nginx will proxy to the python application.</p>
<h3><code>./Makefile</code></h3>

<p>We'll use this makefile to simulate a real deployment to a real kubernetes cluster</p>
<pre><code class="language-makefile">.PHONY: run up svc

version = $(shell date +%H%M%S)

run:
	python3 app.py

up: dependencies
up:
	docker build -f docker/flask/Dockerfile -t localhost:5000/flask:$(version) .
	docker push localhost:5000/flask:$(version)
	cat kube/deployment.yaml | sed &quot;s/__VERSION__/$(version)/g&quot; | kubectl apply -f -

svc: dependencies
svc:
	cat kube/deployment.yaml | sed &quot;s/__VERSION__/214714/g&quot; | kubectl apply -f -

dependencies:
	kubectl apply -f kube/config-map.yaml
    kubectl apply -f kube/service.yaml
    kubectl apply -f kube/ingress.yaml
    kubectl apply -f kube/ps-claim.yaml
    kubectl apply -f kube/ps-configmap.yaml
    kubectl apply -f kube/ps-deployment.yaml
    kubectl apply -f kube/ps-service.yaml

clean:
	docker images | grep localhost | awk &#039;{print $$3}&#039; | uniq | xargs docker rmi -f
</code></pre>

<blockquote>Please note that in makefiles, you <strong>MUST</strong> use tabs for the commands bellow every stage and not spaces</blockquote>
<h3><code>./build.sh</code></h3>
<p>This file is used by the init container to generate the content of the <code>public</code> directory</p><pre><code class="language-bash">#!/bin/bash

npm install --no-interaction
npm run build

touch public/ready
</code></pre>

<p>At this point, if you open the url <a href="http://dev.k8s/" title="http://dev.k8s/" target="_blank">http://dev.k8s/</a> in your browser, you should see a 404 Page Not Found error, which is fine.</p>
<p>Our setup, will use a private/local registry for the docker images and that is running on the minikube virtual machine.</p>
<p>Let's stop and delete the local docker containers that we used earlier:</p>
<pre><code class="language-bash">docker stop $(docker ps -q)
docker rm $(docker ps -q)
</code></pre>

<p>Run the following command to connect to the minikube docker</p>
<pre><code class="language-bash">eval $(minikube docker-env)
</code></pre>
And then 
<pre><code class="language-bash">docker run -d -p 5000:5000 --name myregistry registry:2</code></pre>

again 
<pre><code class="language-bash">eval $(minikube docker-env)
</code></pre>

<p>To make sure you are using the docker from minikube, run <code>docker images</code> and you should see k8s docker images listed.</p>
<p>Run the following command to build the docker image, push it to the registry and deploy all resources to minikube kubernetes:</p>
<pre><code class="language-bash">make up
</code></pre>
</body>
</html>
After all  makefile is get the kubernetes service 
Also verify the pods are running or not

`kubectl get pods`
And verify the service
`kubectl get services`

# Setup CI-CD
**We will use CIRCLE-CI for this**

1. Go to https://circleci.com
2. **Signin** or **Signup** if you have not created a circleci account yet.
3. Now Click on **Create Project**  then Click on **Build, test, and deploy your software application**
4. Then give it a name like **grafana-app-nginx-kubernetes** then click on **Next:set up a pipeline**
5. Leave to default click on **Next: Choose a repo**
6. On **Let's choose a repo for your pipeline** select for repository for this project or search for it then click on **Next:Set up Config**
7. Then click on **Prepare config file** after sometime
8. Click on **Next**
9. Again click on **Next**
10. Now click on **Commit config and run**
11. Let it run for sometime
12. Run the following
```bash
git add .
git commit -m "Adding the files"
git push
```
13. Now  do `git pull `and checkout to `git checkout circleci-project-setup`  and copy and paste the following contents in `./.circleci/config.yml`
```yaml
version: 2.1

jobs:
  initialize:
    machine:
      image: ubuntu-2204:current
    steps:
      - checkout

      # Install Minikube
      - run:
          name: Install Minikube
          command: |
            curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
            sudo install minikube-linux-amd64 /usr/local/bin/minikube

      # Start Minikube
      - run:
          name: Start Minikube
          command: minikube start --driver=docker

      - run:
          name: Install kubectl
          command: |
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
            sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
      # Build Docker image
      - run:
          name: Install make file
          command: sudo apt install make -y

      # Load Docker image into Minikube
      - run:
          name: Set alias for kubectl
          command: alias kubectl="minikube kubectl --"
      - run:
          name: Install Helm
          command: |
            curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
            chmod 700 get_helm.sh
            ./get_helm.sh
      # Install promethues and grafana
      - run:
          name: Install promethues and grafana
          command: |
            helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
            helm repo update
            helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack -f ./kube/custom-values.yaml
      
      - run: 
          name: Install minikube addons
          command: |
            minikube addons enable registry 
            minikube addons enable metrics-server 
            minikube addons enable ingress 
            minikube addons enable ingress-dns
            minikube addons enable storage-provisioner
      
      - run: 
          name: Install Minikube to hostfile
          command: |
            sudo bash -c "echo \"$(minikube ip) dev.k8s\" >> /etc/hosts"
            sudo bash -c "echo \"$(minikube ip) grafana.k8s\" >> /etc/hosts"
      
      - run: 
          name: Install Nodejs v20
          command: |
            curl -fsSL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh
            sudo -E bash nodesource_setup.sh
            sudo apt update
            sudo apt install nodejs -y
      
      - run:
          name: Run npm Build
          command: |
            npm install --no-interaction
            npm run build
            touch public/ready
      
      - run: 
          name: Execute the deployment 
          command: | 
            eval $(minikube docker-env)
            docker run -d -p 5000:5000 --name myregistry registry:2
            eval $(minikube docker-env)  
            make up

workflows:
  version: 2
  deploy:
    jobs:
      - initialize
```
- Now run the following
```bash
git add .
git commit -m "Adding the files"
git push
```
14. Now go to your github repository click on **Pull requests** then click on New pull request in compare section select `circleci-project-setup` then click on **create pull request** again click on **create pull request** wait until **Merge pull request** button appears to be green then click **Merge pull request** then **confirm merge** now your are done with the steps.


