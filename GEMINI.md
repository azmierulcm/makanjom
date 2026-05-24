# Makanjom Project Mandates

## Vision: The Best Food Web Application on the Internet
Makanjom is not just a tool; it is a premium discovery experience. Every design decision must prioritize delight, tactile feedback, and visual excellence.

## Core Principle: Mobile-First Mentality
Every feature, component, and layout must be designed for the **handheld experience first**. Desktop is an extension of the mobile experience, not the other way around.

### 1. Design & Ergonomics
- **Thumb-Zone Optimization**: Primary actions (Spin buttons, filters, navigation) must be within easy reach of the thumb.
- **Tactile Feedback**: Use Haptics (via `navigator.vibrate` where supported) and high-fidelity Framer Motion animations to simulate physical interaction.
- **Typography**: Large, legible headings and high-contrast body text optimized for small screens.
- **Spacing**: Generous touch targets (minimum 44x44px) to prevent mis-clicks.

### 2. Engineering Standards
- **Responsive Layouts**: Use Tailwind's `flex-col` and `grid-cols-1` as defaults. Use `md:` and `lg:` prefixes ONLY to expand for larger screens.
- **Performance**: Optimize image assets and keep bundle sizes lean for fast loading over 4G/5G networks.
- **Lazy Loading**: Defer non-critical UI elements to ensure the 'First Meaningful Paint' on mobile is under 1s.

### 3. UI/UX "Magic"
- **Spring Physics**: Use high-tension spring animations for a "snappy" feel.
- **Gradients & Depth**: Use soft shadows and layered backgrounds to create a sense of physical space on a 2D screen.
- **Audio Layers**: Subtle, high-frequency interface sounds to reinforce the tactile experience.

---
*Every build must be validated on a mobile viewport simulator before being considered 'complete'.*
