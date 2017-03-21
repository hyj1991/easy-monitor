<h1>Easy-Monitor</h1>

<p><a href="README_EN.md">English Version</a></p>

<h2>简介</h2>

<p>轻量级的Node进程状态监控工具，仅仅需要项目入口 <code>require</code> 一次，就可以非常便捷地展示出进程的状态细节。</p>

<p><a href="https://github.com/hyj1991/easy-monitor">Easy-Monitor项目Git 地址</a></p>

<h3>I.功能</h3>

<ul><li><strong>找出执行时长耗费最久的5个或者更多的函数</strong></li><li><strong>找出那些执行时间超出预期的5函数</strong></li><li><strong>找出v8引擎无法优化的函数</strong></li></ul>

<p>以上展示的列表数量均可在url中直接配置，另外展示列表内容可以在项目中对 <strong>函数名</strong> 以及 <strong>函数所在的文件路径</strong> 进行过滤，来保证展示出的就是开发者所需要的信息。</p>

<p>这个工具的目的是帮助大家更深入的理解自己的Node进程，性能优化时能更有针对性，最终提升大家的项目体验。</p>

<h3>II.特点</h3>

<ul><li><strong>轻量级</strong>：<code>Easy-Monitor</code> 非传统C/S物理分离模式，<code>require</code> 后即可使用，没有额外的监控server/agent部署成本</li><li><strong>运行时</strong>：<code>Easy-Monitor</code> 针对的是运行时的函数性能以及内存细节进行处理展示，可用于线上生产环境项目。</li><li><strong>无状态</strong>：<code>Easy-Monitor</code> 永远展示的是开发者访问时的业务进程状态。</li></ul>

<h2>兼容性</h2>

<ul><li>Node v6.x</li><li>Node v5.x</li><li>Node v4.x</li></ul>

<p>暂不支持Node v7.x版本</p>

<h2>快速开始</h2>

<p><code>Easy-Monitor</code> 的使用非常简单，三步即可开启你的专属监控。</p>

<h3>I.安装</h3>

<p>在控制台执行下面的命令安装：</p>

<p><code>
npm install easy-monitor
</code></p>

<h3>II.项目中引入</h3>

<p>在你的项目入口文件中按照如下方式引入，传入你的项目名称：</p>

<p><pre>code>
const easyMonitor = require(&#39;easy-monitor&#39;);
easyMonitor(&#39;你的项目名称&#39;);
</code></pre></p>

<h3>III.访问监控页面</h3>

<p>打开你的浏览器，输入以下地址，即可看到进程相关信息：</p>

<p><code>
http://127.0.0.1:12333
</code></p>

<h3>IV.下面是一个嵌入Express应用的完整例子</h3>

<p><pre><code>
&#39;use strict&#39;;
const easyMonitor = require(&#39;easy-monitor&#39;);
easyMonitor(&#39;your project name&#39;);
const express = require(&#39;express&#39;);
const app = express();

app.get(&#39;/hello&#39;, function (req, res, next) {
    res.send(&#39;hello&#39;);
});

app.listen(8082);
</code></pre></p>

<p>将上述的内容保存成一个js文件，启动后访问 <code>http://127.0.0.1:12333</code>即进入Easy-Monitor的首页，就是这样的简单！</p>

<h2>高级定制化</h2>

<h3>I.定制化参数</h3>

<p><code>Easy-Monitor</code> 也为大家保留了一些重要的属性可以方便定制化，依靠执行 <code>require(&#39;easy-monitor&#39;)(object)</code> 函数时传入一个对象，来替代默认传入的项目名称的字符串，这个传入的对象可以包含如下属性：</p>

<ul><li><p><strong>logLevel</strong>：Number类型，默认是2，用来设置日志级别：</p><ul><li>0：不输出任何日志</li><li>1：输出error日志</li><li>2：输出info日志</li><li><p>3：输出debug日志</p></li></ul></li><li><p><strong>appName</strong>：String类型，默认是 process.title 获取到的值，用来设置项目名称</p></li><li><p><strong>httpServerPort</strong>：Numver类型，默认是 12333，用来设置监控HTTP服务器的侦听端口</p></li><li><p><strong>filterFunction</strong>：函数，默认将profiling的结果中过滤掉了包含node_modules、anonymous以及路径中不包含 &quot;/&quot; 的系统函数，开发者可以自己编写过滤函数来找出自己想要的结果，入参和返回值：</p><ul><li>filePath：String类型，profiling结果函数所在的文件全路径</li><li>funcName：String类型，pfofiling结果函数的名称</li><li><p>返回值：为true表示保留结果，false表示过滤掉</p></li></ul></li><li><p><strong>monitorAuth</strong>：函数，默认不鉴权，用来进行登入监控页面的鉴权，开发者可以自己编写鉴权函数，入参和返回值：</p><ul><li>user：String类型，为用户名</li><li>pass：String类型，为用户键入密码</li><li>返回值：Promise对象实例，resolve(true)表示鉴权通过，resolve(false)或者reject表示鉴权失败</li></ul></li></ul>

<h3>II.定制化例子</h3>

<p>下面是一个使用 <code>Easy-Monitor</code> 嵌入Express项目的定制化的完整例子：</p>

<p><pre><code>
&#39;use strict&#39;;
const easyConfig = {
    logLevel: 3,
    appName: &#39;My Project 1&#39;,
    httpServerPort: 8888,
    filterFunction: function (filePath, funcName) {
        if (funcName === &#39;anonymous&#39; || ~filePath.indexOf(&#39;node_modules&#39;)) {
            return false;
        }
        return Boolean(/^(\/.*/.test(filePath));
    },
    monitorAuth: function (user, pass) {
        return new Promise(resolve =&gt; resolve(Boolean(user === &#39;admin&#39; &amp;&amp; pass === &#39;lifeishard&#39;)));
    }
};
const easyMonitor = require(&#39;easy-monitor&#39;);
easyMonitor(easyConfig);

const express = require(&#39;express&#39;);
const app = express();

app.get(&#39;/hello&#39;, function helloIndex(req, res, next) {
    let date = Date.now();
    while (Date.now() - date &lt; 300) {
    }
    res.send(&#39;hello&#39;);
});

app.listen(8082);</code></pre></p>

<p>这个例子中，日志级别被调整为3，监控服务器端口更改为8888，也设置了过滤规则和简单的鉴权规则。
并且 <code>/hello</code> 这个路由被设置成阻塞300ms后返回，大家可以打开 <code>http://127.0.0.1:8888</code> 进入 <code>Easy-Monitor</code> 首页，点击项目名称或者pid进行profiling操作，同时不停访问 <code>http://127.0.0.1:8082/hello</code> 这个路径，然后观察结果来自行尝试一番。</p>

<h2>监控页面一览</h2>

<h3>I.首页</h3>

<h4>1.查看整个项目</h4>

<p><img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/IndexProject.jpeg" alt="IndexProject"></p>

<p>如图，点击项目名称，则会对 <strong>整个项目</strong> 所有的进程进行profiling操作，这个所有进程包含：</p>

<ul><li>单进程模式下则只有一个主进程</li><li>cluster模式下所有的子进程</li></ul>

<h4>2.查看项目下某一个子进程</h4>

<p><img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/IndexProject.jpeg" alt="IndexProject"></p>

<p>如图，在cluster模式下项目会有多个子进程，点击某一个特定的pid，则只会对 <strong>此pid对应的子进程</strong> 进行profiling操作。</p>

<h4>3.多项目部署</h4>

<p><img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/IndexMulti.jpeg" alt="IndexMulti"></p>

<p>如图，<code>Easy-Monitor</code> <strong>支持多项目部署</strong>，用法和单项目是一模一样的，可以参考前面的快速开始。那么多项目启动后，监控页面会展示出不同的项目名称和对应的子进程pid。</p>

<h3>II.监控详情页</h3>

<h4>1.执行时间超出预期的函数列表</h4>

<p><img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/DetailLong.jpeg" alt="DetailLong"></p>

<p>如图，可以追加 <code>querystring</code> 参数的形式自定义预期时间以及展示的条数，如下：</p>

<ul><li><code>?timeout=你预期的时间(ms)</code></li><li><code>?long_limit=你想展示的条数</code></li><li><code>?timeout=你预期的时间(ms)&amp;long_limit=你想展示的条数</code></li></ul>

<h4>2.耗费时间最久的函数列表</h4>

<p><img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/DetailTop.jpeg" alt="DetailTop"></p>

<p>如图，可以追加 <code>querystring</code> 参数的形式自定义展示条数，如下：</p>

<ul><li><code>?top_limit=你想展示的条数</code></li></ul>

<h4>3.v8引擎无法优化的函数列表</h4>

<p><img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/DetailBail.jpeg" alt="DetailBail"></p>

<p>如图，可以追加 <code>querystring</code> 参数的形式自定义展示条数，如下：</p>

<ul><li><code>?bail_limit=你想展示的条数</code></li></ul>

<h2>测试</h2>

<p>clone下本代码后，使用npm安装依赖，然后执行如下测试脚本：</p>

<p><code>
npm run test
</code></p>

<p>即可看到覆盖率测试报告。</p>

<h1>License</h1>

<p><a href="LICENSE">MIT License</a></p>

<p>Copyright (c) 2017 hyj1991</p>