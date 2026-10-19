# 人工视觉验收指南 · SWUST Keynote Lab

用桌面 Chrome 打开 `dist/swust-keynote-showcase.html`，建议先以 1920×1080 或全屏体验，再缩小至 1366×768、960×640。断网后仍应完整可用。箭头 / Space 翻页，T 目录，N 讲者备注，P 锁定备注，F 全屏，R 重置当前交互，B 静态。聚焦组件后，其方向键优先；Space 激活按钮。小窗口是等比预览。

先用约 8 分钟按下面路径体验，随后挑重点反复操作：

| 页 | 亲自操作 | 观察标准 |
|---|---|---|
| 01 | 悬停、Tab 聚焦、按住，再聚焦/返回 | 白字始终清楚，蓝色平滑加深，焦点圈可见；对象连续移动 |
| 02 | 切换三个内容类型 | 构图确实变成概念、流程、左右比较；没有宣称运行模型 |
| 03 | Before / After | 信息相同；层级、对齐、留白明显改善 |
| 04 | Frosted / Optical / Advanced；依次调五个参数 | 彩线在边缘偏折，中心稳定；色散可微调；Renderer 显示真实 SVG/WebGL/Frosted；文本稳定可读 |
| 05 | 拖动后松手；试低/高阻尼，再改质量 | 对象跟手；参数改变真实运动，而非只更新数字 |
| 06 | Replay；调 Bézier 控制点后再放 | 四条轨道距离一致、同时起步，节奏可辨；Spring 可重定向 |
| 07 | 展开、途中收起、连续快速点击、再次返回 | 面板始终在左侧安全轨道，右侧说明全程可读；无副本或跳回起点 |
| 08 | 深入 → 返回 → 焦点转移 → 章节 | 各镜头目的不同；A/B 空间关系连续，旧标题迅速退后，仍可随时反向 |
| 09 | Next、Previous、Reset | 路径逐段生长并沿原路回退，Reset 无旧线残留 |
| 10 | Replay；看“抵达”后的最后约 1 秒 | Before 硬切；After 线与箭头同色渐变、旧/新字交叉淡化、结果平滑出现；语义提交时刻一致 |
| 10 | 在抵达和收尾时分别 Interrupt / Reverse / Reset | 当前运动立即响应；没有旧文字回来、幽灵边或无法结束的队列 |
| 11 | 看胶囊/卡片上下留白；悬停、按住、展开再返回；调 Emphasis | 收起时按钮在外框内上下对称；展开后仍在原 header slot 居中；文字不随滑块变淡 |
| 12 | 按 Ready → Start → Complete | 只开放允许的操作；模型状态准时改变，视觉随后收尾 |
| 13 | 连点目标，运行连续点击后 Reset | 连续响应新目标；速度/位置是真实读数，有限测试会停下 |
| 14 | 运动中开 Reduced Motion / Static，切换不透明并采样 | 立即落到相同结果；所有控制仍可用，没有虚构 FPS |
| 15 | Replay Workflow；回看收尾 | 六步关系连贯；版本与已完成升级一致，回看按钮有效 |

如果发现不舒服的瞬间，记录“页码、动作顺序、发生在运动中还是结束后、窗口尺寸”。尤其注意路径退色、箭头高亮、状态字、结果说明、边框和禁用按钮。静态最终截图不能证明这些过渡平滑。

the fresh Showcase screenshots 是整体布局参考；`settlement-frames.json` 是真实中间颜色/透明度数据；`settlement-middle.png`、`morph-middle.png`、`timing-middle.png` 辅助观察。无头 Chrome 的自动测试不能代替真实投影机、触摸屏、系统读屏器或主观舒适度判断。Web 玻璃是近似，不代表 Apple 官方光学品质，也未宣称普遍 60fps。

## material 四项重点复查

T 目录可直接选第 1、4、7、11 页。第 4 页 Stable 禁用位移/色散，只有 Optical/Advanced 真实改变这些参数。断网打开独立 `dist/glass-material-lab.html`，并列观察三个等级；点“测试缺少背景输入”应全部显示 Frosted Fallback，恢复按钮重新加载。不要把 requested Advanced 当成实际 Renderer。

用浏览器 100%/125%/150% zoom 和三个窗口尺寸检查阅读与空间。自动证据中的 CDP metrics 模拟125%/150%的 viewport/DPR 缩放关系，真实浏览器 UI zoom 与投影硬件仍需人工验证。fresh visual fixture screenshots 提供对比，`*-07-middle/reverse.png` 与碰撞 JSON 包含动态证据，`report.json` 包含实际颜色、间距和像素差。Firefox/WebKit 没有安装，不能视为已通过。
