# Architecture & Technical Decisions

## Why Next.js App Router?
- Server components for better performance
- Built-in routing
- Easy deployment

## State Management
- React hooks for local state
- Lazorkit SDK handles wallet state
- No external state library needed

## Styling Approach
- Tailwind CSS for utility classes
- Custom CSS for complex animations
- Glassmorphism design system

## Security Considerations
- All transactions on devnet
- Passkeys stored in device secure enclave
- No private keys in browser storage