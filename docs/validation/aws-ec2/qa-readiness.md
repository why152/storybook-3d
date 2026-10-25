# Book readiness — two viewports × five chapters

CI evidence, not a frame-rate guarantee. Source: actual Chromium DOM + image decoding.

| Viewport | Chapter | SVG images | Image loaded | Gutter Δpx | Overflow px | p95 rAF interval ms | Screenshot |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| desktop-1280x720 | HELLO | 14 | yes | 0 | 0 | 16.7 | [open](qa-desktop-1280x720-hello.png) |
| desktop-1280x720 | GROW | 16 | yes | 0 | 0 | 16.8 | [open](qa-desktop-1280x720-grow.png) |
| desktop-1280x720 | TOGETHER | 16 | yes | 0 | 0 | 16.7 | [open](qa-desktop-1280x720-together.png) |
| desktop-1280x720 | DREAM | 16 | yes | 0 | 0 | 16.7 | [open](qa-desktop-1280x720-dream.png) |
| desktop-1280x720 | WISH | 16 | yes | 0 | 0 | 16.7 | [open](qa-desktop-1280x720-wish.png) |
| mobile-390x844 | HELLO | 14 | yes | 0 | 0 | 16.7 | [open](qa-mobile-390x844-hello.png) |
| mobile-390x844 | GROW | 16 | yes | 0 | 0 | 16.7 | [open](qa-mobile-390x844-grow.png) |
| mobile-390x844 | TOGETHER | 16 | yes | 0 | 0 | 16.8 | [open](qa-mobile-390x844-together.png) |
| mobile-390x844 | DREAM | 16 | yes | 0 | 0 | 16.8 | [open](qa-mobile-390x844-dream.png) |
| mobile-390x844 | WISH | 16 | yes | 0 | 0 | 16.8 | [open](qa-mobile-390x844-wish.png) |

Treat the rAF interval as a **software Chromium environment observation**. Never use it to claim a GPU shader outperforms CSS. Real device profiling is required.

Full machine-readable data: [qa-readiness.json](qa-readiness.json).
