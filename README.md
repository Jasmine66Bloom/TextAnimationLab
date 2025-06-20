# TextAnimationLab

基于Web的交互式文字动画效果生成器

## 功能特性

- 多种预设动画效果
- 实时预览与参数调整
- 响应式设计
- 支持自定义文字

## 快速开始

### 使用Python启动

```bash
# 进入项目目录
cd /path/to/TextAnimationLab

# Python 3
python -m http.server 8000

# 或Python 2
python -m SimpleHTTPServer 8000

# 访问 http://localhost:8000
```

### 使用Node.js启动

```bash
# 全局安装http-server
npm install -g http-server

# 启动服务
http-server

# 访问 http://localhost:8080
```

## 使用说明

1. 输入目标文字
2. 选择动画效果
3. 调整参数
4. 实时预览

## 示例效果

以下是一些使用TextAnimationLab创建的文字动画效果示例：

<table>
  <tr>
    <td><img src="./example/text-animation-1750386675810.gif" alt="波浪效果 + 彩虹色"></td>
    <td><img src="./example/text-animation-1750386710859.gif" alt="弹跳动画"></td>
    <td><img src="./example/text-animation-1750386742409.gif" alt="3D旋转效果"></td>
  </tr>
  <tr>
    <td><img src="./example/text-animation-1750386759852.gif" alt="霓虹灯效果"></td>
    <td><img src="./example/text-animation-1750386790280.gif" alt="打字机效果"></td>
    <td><img src="./example/text-animation-1750386801666.gif" alt="模糊淡入"></td>
  </tr>
  <tr>
    <td><img src="./example/text-animation-1750386814809.gif" alt="粒子效果"></td>
    <td><img src="./example/text-animation-1750386832796.gif" alt="火焰效果"></td>
    <td><img src="./example/text-animation-1750386853032.gif" alt="故障效果"></td>
  </tr>
</table>

## 技术栈

- HTML5 Canvas
- Vanilla JavaScript
- CSS3

> 推荐使用现代浏览器（Chrome/Firefox/Safari/Edge）
