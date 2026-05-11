# PNG 转 SVG 操作指南

## 目录

- [方法一：内嵌 Base64（无需安装依赖）](#方法一内嵌-base64无需安装依赖)
- [方法二：添加自适应背景（深浅标题栏都可见）](#方法二添加自适应背景在深色浅色标题栏上都可见)
- [方法三：使用 potrace 进行矢量追踪（推荐）](#方法三使用-potrace-进行矢量追踪推荐)
- [方法四：使用在线工具](#方法四使用在线工具)
- [常见问题](#常见问题)

---

## 方法一：内嵌 Base64（无需安装依赖）

这是本项目当前使用的方式，利用 Node.js **内置模块**（`fs`、`path`），无需安装任何第三方包。

### 核心原理

将 PNG 图片的二进制数据编码为 Base64 字符串，然后嵌入到 SVG 的 `<image>` 标签中。生成的 SVG 文件包含原始 PNG 的所有像素数据，显示效果完全一致。

### 单行命令

在项目根目录（`d:/react-test`）打开终端，执行以下命令：

```bash
node -e "const f=require('fs');const p=f.readFileSync('src/assets/icon.png');const b=p.toString('base64');const s='<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"128\" height=\"128\" viewBox=\"0 0 128 128\">\n  <image width=\"128\" height=\"128\" xlink:href=\"data:image/png;base64,'+b+'\"/>\n</svg>';f.writeFileSync('src/assets/icon.svg',s,'utf8');console.log('OK: icon.svg created')"
```
执行后会在 `src/assets/` 目录下生成 `icon.svg` 文件，内容是一个包含 PNG 图像的 SVG。

### 自定义使用

如果需要转换其他图片（如 `hero.png`），修改输入和输出文件名即可：

```bash
node -e "const f=require('fs');const p=f.readFileSync('src/assets/hero.png');const b=p.toString('base64');const s='<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"128\" height=\"128\" viewBox=\"0 0 128 128\">\n  <image width=\"128\" height=\"128\" xlink:href=\"data:image/png;base64,'+b+'\"/>\n</svg>';f.writeFileSync('src/assets/hero.svg',s,'utf8');console.log('OK: hero.svg created')"
```

也可以将命令保存为脚本文件方便复用。新建 `scripts/png2svg.mjs`：

```javascript
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// 修改这里：
const inputFile  = resolve("src/assets/icon.png");
const outputFile = resolve("src/assets/icon.svg");

const pngBuffer = readFileSync(inputFile);
const base64 = pngBuffer.toString("base64");

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="128" height="128" viewBox="0 0 128 128">
  <image width="128" height="128" xlink:href="data:image/png;base64,${base64}"/>
</svg>`;

writeFileSync(outputFile, svgContent, "utf8");
console.log(`✅ SVG 已生成: ${outputFile}`);
```

运行脚本：

```bash
node scripts/png2svg.mjs
```

### 注意事项

| 项目 | 说明 |
|------|------|
| ✅ 优点 | 无需任何外部依赖，显示效果与原图完全一致 |
| ❌ 缺点 | SVG 文件较大（等于 PNG 的 Base64 大小），放大后仍会模糊（像素图本质不变） |
| 适用场景 | 图标、小尺寸图片，需要保持原图视觉效果 |

---

## 方法二：添加自适应背景（在深色/浅色标题栏上都可见）

生成的纯 PNG 内嵌 SVG 如果是深色图标，放在浏览器深色标题栏上就看不见了。本方法给 SVG **添加圆形背景 + CSS 媒体查询**，让图标在浅色和深色模式下都清晰可见。

### 核心原理

1. **`<circle>` 圆底**：在图标下方画一个圆形背景，确保图标与标题栏颜色有反差
2. **`<clipPath>` 裁剪**：将 PNG 图标裁剪为圆形，与圆底对齐
3. **`@media (prefers-color-scheme: dark)`**：CSS 媒体查询，自动检测系统是否为深色模式，并切换背景色

### 单行命令

```bash
node -e "var f=require('fs');var p=f.readFileSync('src/assets/icon.png');var b=p.toString('base64');f.writeFileSync('src/assets/icon.svg','<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"128\" height=\"128\" viewBox=\"0 0 128 128\">\n  <defs>\n    <style>\n      .bg { fill: #f5f0ff; }\n      .brd { fill: none; stroke: #c8b8e8; stroke-width: 4; }\n      @media (prefers-color-scheme: dark) {\n        .bg { fill: #ffffff; }\n        .brd { stroke: #ffffff; stroke-width: 3; }\n      }\n    </style>\n    <clipPath id=\"c\"><circle cx=\"64\" cy=\"64\" r=\"62\"/></clipPath>\n  </defs>\n  <circle class=\"bg\" cx=\"64\" cy=\"64\" r=\"62\"/>\n  <circle class=\"brd\" cx=\"64\" cy=\"64\" r=\"62\"/>\n  <g clip-path=\"url(#c)\">\n    <image width=\"128\" height=\"128\" xlink:href=\"data:image/png;base64,'+b+'\"/>\n  </g>\n</svg>');console.log('DONE')"
```

### 生成的 SVG 结构说明

生成的 SVG 文件内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <style>
      /* 浅色模式下：浅紫色圆底 + 淡紫边框 */
      .bg { fill: #f5f0ff; }
      .brd { fill: none; stroke: #c8b8e8; stroke-width: 4; }
      
      /* 深色模式下：白色圆底 + 白色边框 */
      @media (prefers-color-scheme: dark) {
        .bg { fill: #ffffff; }
        .brd { stroke: #ffffff; stroke-width: 3; }
      }
    </style>
    <!-- 裁剪路径：圆形，将 PNG 图标裁剪为圆形 -->
    <clipPath id="c">
      <circle cx="64" cy="64" r="62"/>
    </clipPath>
  </defs>
  
  <!-- 圆形背景 -->
  <circle class="bg" cx="64" cy="64" r="62"/>
  <!-- 圆形边框 -->
  <circle class="brd" cx="64" cy="64" r="62"/>
  
  <!-- 裁剪后的 PNG 图标，与圆底对齐 -->
  <g clip-path="url(#c)">
    <image width="128" height="128"
           xlink:href="data:image/png;base64,..."/>
  </g>
</svg>
```

### 各元素说明

| 元素 | 作用 |
|------|------|
| `<style>` | 定义 CSS 样式，控制背景和边框颜色 |
| `.bg` | 圆形背景填充色。浅色模式为浅紫 `#f5f0ff`，深色模式切换为白色 `#ffffff` |
| `.brd` | 圆形边框。浅色模式为淡紫 `#c8b8e8`，深色模式为白色 `#ffffff` |
| `@media (prefers-color-scheme: dark)` | **CSS 媒体查询**，当系统处于深色模式时自动切换样式 |
| `<clipPath>` | 将 PNG 图标裁剪为圆形，与背景对齐 |
| `<image>` | 内嵌原始 PNG 图片的 Base64 数据 |

### 颜色自定义

根据需要修改以下颜色值：

```css
/* 浅色模式 */
.bg { fill: #f5f0ff; }        /* 改成你想要的浅色背景，如 #ffffff（纯白） */
.brd { stroke: #c8b8e8; }     /* 改成你想要的边框色，如 #cccccc（灰色） */

/* 深色模式 */
.bg { fill: #ffffff; }        /* 深色模式下的背景色，如 #333333（深灰） */
.brd { stroke: #ffffff; }     /* 深色模式下的边框色 */
```

### 使用场景

| 场景 | 说明 |
|------|------|
| ✅ 浏览器标签栏图标 (favicon) | 深色/浅色标题栏都可见 |
| ✅ 系统托盘图标 | 跟随系统主题切换 |
| ✅ 深色模式网站图标 | 自动适配用户主题偏好 |

---

## 方法三：使用 potrace 进行矢量追踪（推荐）

如果需要将 PNG **真正转换为矢量图形**（放大不失真），推荐使用 `potrace` 库。

### 安装依赖

```bash
npm install potrace
```

### 转换脚本

创建 `scripts/png2svg-trace.mjs`：

```javascript
import { trace } from "potrace";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const inputFile  = resolve("src/assets/icon.png");
const outputFile = resolve("src/assets/icon.svg");

const pngBuffer = readFileSync(inputFile);

trace(pngBuffer, { color: "#000000", background: "transparent" }, (err, svg) => {
  if (err) {
    console.error("❌ 转换失败:", err);
    process.exit(1);
  }
  writeFileSync(outputFile, svg, "utf8");
  console.log(`✅ 矢量 SVG 已生成: ${outputFile}`);
});
```

运行：

```bash
node scripts/png2svg-trace.mjs
```

### 常用推荐操作命令汇总

| 命令 | 说明 |
|------|------|
| `npm install potrace` | 安装 potrace 矢量追踪库 |
| `npm install sharp` | 安装 sharp 图片处理库（支持缩放、格式转换等） |
| `npm install svgo` | 安装 SVGO 用于压缩优化 SVG 文件 |
| `npx svgo src/assets/icon.svg` | 压缩优化 SVG 文件大小 |
| `npm install png-to-svg` | 安装另一个 PNG 转 SVG 库（简化版） |

---

## 方法四：使用在线工具

如果不想使用命令行，也可以使用在线转换工具：

| 工具 | 地址 |
|------|------|
| Convertio | https://convertio.co/zh/png-svg/ |
| Vectorizer | https://www.vectorizer.io/ |
| PNG to SVG | https://www.pngtosvg.com/ |

---

## 常见问题

### Q1: 生成的 SVG 在浏览器中无法显示？

确保 PNG 文件路径正确，且文件未损坏。可以用文本编辑器打开 SVG 文件，检查 `<image>` 标签中的 Base64 数据是否完整。

### Q2: 如何查看 SVG 文件内容？

```bash
# 查看前 200 个字符
node -e "console.log(require('fs').readFileSync('src/assets/icon.svg','utf8').slice(0,200))"
```

### Q3: SVG 与原 PNG 显示效果不一致？

方法一（Base64 内嵌）的 SVG 与原图效果完全一致。如果使用 potrace 进行矢量追踪，由于算法会将像素轮廓转为路径，复杂图片可能会有差异，可以调整 `turdsize`、`threshold` 等参数优化。

### Q4: 如何批量转换多个 PNG？

**简单版（无背景）：**
```bash
# 批量将 src/assets/ 下所有 PNG 转为 Base64 内嵌 SVG
node -e "
const f=require('fs'),p=require('path');
const dir='src/assets';
f.readdirSync(dir).filter(n=>n.endsWith('.png')).forEach(n=>{
  const buf=f.readFileSync(p.join(dir,n));
  const b=buf.toString('base64');
  const name=n.replace(/\.png$/,'');
  const svg='<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"128\" height=\"128\" viewBox=\"0 0 128 128\"><image width=\"128\" height=\"128\" xlink:href=\"data:image/png;base64,'+b+'\"/></svg>';
  f.writeFileSync(p.join(dir,name+'.svg'),svg,'utf8');
  console.log('✅ '+name+'.svg');
})
"
```

**自适应背景版（深浅标题栏都可见）：**
```bash
node -e "
var f=require('fs'),p=require('path');
var dir='src/assets';
f.readdirSync(dir).filter(function(n){return n.endsWith('.png')}).forEach(function(n){
  var buf=f.readFileSync(p.join(dir,n));
  var b=buf.toString('base64');
  var name=n.replace(/\.png$/,'');
  var svg='<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"128\" height=\"128\" viewBox=\"0 0 128 128\">\n  <defs>\n    <style>\n      .bg { fill: #f5f0ff; }\n      .brd { fill: none; stroke: #c8b8e8; stroke-width: 4; }\n      @media (prefers-color-scheme: dark) {\n        .bg { fill: #ffffff; }\n        .brd { stroke: #ffffff; stroke-width: 3; }\n      }\n    </style>\n    <clipPath id=\"c\"><circle cx=\"64\" cy=\"64\" r=\"62\"/></clipPath>\n  </defs>\n  <circle class=\"bg\" cx=\"64\" cy=\"64\" r=\"62\"/>\n  <circle class=\"brd\" cx=\"64\" cy=\"64\" r=\"62\"/>\n  <g clip-path=\"url(#c)\">\n    <image width=\"128\" height=\"128\" xlink:href=\"data:image/png;base64,'+b+'\"/>\n  </g>\n</svg>';
  f.writeFileSync(p.join(dir,name+'.svg'),svg,'utf8');
  console.log('✅ '+name+'.svg');
})
"
```

### Q5: 自适应背景的 SVG 在某些浏览器上不生效？

`prefers-color-scheme` 媒体查询在 **Chrome 76+、Firefox 67+、Safari 12.1+、Edge 79+** 中支持。旧版浏览器会回退到浅色模式样式（`.bg { fill: #f5f0ff; }`），不影响正常显示。
