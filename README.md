# 步数追踪应用

这是一个简单的步数追踪应用，允许用户记录每日步数并查看小组内的统计数据。

## 部署指南

要正确部署此应用到GitHub Pages，请按照以下步骤操作：

1. **创建一个新的GitHub仓库**
   - 登录您的GitHub账户
   - 点击右上角的"+"图标，选择"New repository"
   - 为仓库起一个有意义的名称，如"step-tracker"（不要使用特殊字符如"-"作为整个名称）
   - 选择"Public"可见性
   - 点击"Create repository"

2. **上传文件到仓库**
   - 将以下文件上传到您的仓库：
     - `index.html`
     - `styles.css`
     - `app.js`
     - `404.html`
     - `README.md`

3. **启用GitHub Pages**
   - 进入仓库设置（Settings）
   - 滚动到"GitHub Pages"部分
   - 在"Source"下拉菜单中选择"main"分支
   - 点击"Save"
   - 等待几分钟，GitHub Pages将被激活

4. **访问您的应用**
   - 部署完成后，您可以通过以下URL访问您的应用：
     `https://[您的GitHub用户名].github.io/[仓库名称]/`
   - 例如：`https://username.github.io/step-tracker/`

## 使用说明

1. **登录/注册**
   - 首次使用时，您需要登录或注册一个账户
   - 示例用户：
     - 用户名：冉启兵，密码：pass1
     - 用户名：冉理，密码：pass2
     - 用户名：冉荣，密码：pass3

2. **加入小组**
   - 登录后，如果您不在任何小组中，系统会提示您加入或创建一个小组
   - 示例小组代码：STEP123

3. **记录步数**
   - 在主界面输入您的每日步数并点击"更新"按钮

4. **查看统计数据**
   - 切换标签页查看不同的统计数据：
     - 今日排名：显示小组成员当天的步数排名
     - 周数据：显示过去7天的步数趋势图
     - 月均值：显示小组成员的月平均步数

## 技术说明

此应用使用以下技术：
- HTML/CSS/JavaScript
- Firebase Realtime Database（数据存储）
- Chart.js（数据可视化）
- GitHub Pages（托管）