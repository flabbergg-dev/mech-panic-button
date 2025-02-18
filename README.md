<p align="center">
  <img alt="MechPanic Logo" src="public/logo.png">
  <h1 align="center">MechPanic</h1>
</p>

<p align="center">
 On-demand and scheduled mechanic services at your fingertips
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#deployment"><strong>Deployment</strong></a>
</p>
<br/>

## About

MechPanic is a Progressive Web App that connects vehicle owners with certified mechanics. Whether you need emergency roadside assistance or want to schedule routine maintenance, MechPanic makes it easy to find and book reliable mechanic services.

## Features
 
- **Emergency Services**

  - Real-time mechanic tracking
  - SOS button for immediate assistance
  - Proximity-based mechanic matching

- **Scheduled Services**

  - Preventive maintenance booking
  - Service history tracking
  - Recurring service reminders

- **Mechanic Portal**

  - Service request management
  - Availability settings
  - Real-time earnings tracking

- **Customer Features**
  - Vehicle profile management
  - Service rating system
  - Digital service records

## Tech Stack

- Next.js 13+ (App Router)
- Supabase for Authentication and Database
- Tailwind CSS for styling
- shadcn/ui components
- PWA capabilities with next-pwa
- Real-time features with Supabase Realtime

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/mech-panic-nextjs.git
   cd mech-panic-nextjs
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and update the environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

Deploy your own MechPanic instance using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fmech-panic-nextjs)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
