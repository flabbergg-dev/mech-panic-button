import Link from "next/link"

export default function Terms() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="px-4 py-6 bg-primary text-primary-foreground md:px-8">
        <div className="container max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold">Terms of Use</h1>
          <p className="mt-2 text-lg text-primary-foreground/80">
            Understand the terms that govern your use of our services.
          </p>
          <p className="mt-2 text-lg text-primary-foreground/80">
            Effective Date: 2024-JUN-09
          </p>
        </div>
      </header>
      <main className="flex-1 px-4 py-12 md:px-8">
        <div className="container max-w-5xl mx-auto space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline"
            prefetch={false}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Go Back
          </Link>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <ClipboardIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Acceptance of Terms</h2>
            </div>
            <p className="text-muted-foreground">
              By accessing or using our website, mobile application, or any of
              our services (collectively, the &quot;Services&quot;), you agree
              to be bound by these Terms of Service (the &quot;Terms&quot;) and
              our Privacy Policy. If you do not agree to these Terms, you are
              not authorized to use the Services.
            </p>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <ZapIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Use of the Services</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Permitted Use</h3>
                <p className="mt-2 text-muted-foreground">
                  You may use the Services for lawful purposes only. You agree
                  not to use the Services in any way that violates applicable
                  laws, regulations, or these Terms.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Prohibited Conduct</h3>
                <p className="mt-2 text-muted-foreground">
                  You may not engage in any activity that could harm, disable,
                  overburden, or impair the Services or interfere with any other
                  party&apos;s use and enjoyment of the Services.
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <LockIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Intellectual Property</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Our Content</h3>
                <p className="mt-2 text-muted-foreground">
                  The Services, including all content, features, and
                  functionality, are owned by Example Inc. and are protected by
                  copyright, trademark, and other intellectual property laws.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Your Content</h3>
                <p className="mt-2 text-muted-foreground">
                  Any content you upload, submit, or post to the Services
                  remains yours. However, by providing content, you grant us a
                  worldwide, non-exclusive, royalty-free license to use,
                  reproduce, modify, and distribute such content.
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <ShieldIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">
                Disclaimers and Limitations
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">
                  Disclaimer of Warranties
                </h3>
                <p className="mt-2 text-muted-foreground">
                  The Services are provided &quot;as is&quot; and &quot;as
                  available&quot; without warranties of any kind, either express
                  or implied. We do not guarantee that the Services will be
                  error-free or uninterrupted.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Limitation of Liability
                </h3>
                <p className="mt-2 text-muted-foreground">
                  In no event shall Example Inc. be liable for any indirect,
                  special, incidental, or consequential damages related to your
                  use of the Services.
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <UsersIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Termination</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Termination by Us</h3>
                <p className="mt-2 text-muted-foreground">
                  We reserve the right to suspend or terminate your access to
                  the Services at any time for any reason, including if we
                  reasonably believe you have violated these Terms.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Termination by You</h3>
                <p className="mt-2 text-muted-foreground">
                  You may stop using the Services at any time. However, you will
                  remain responsible for any outstanding obligations you have
                  under these Terms.
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <GlobeIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">
                Governing Law and Jurisdiction
              </h2>
            </div>
            <p className="text-muted-foreground">
              These Terms and your use of the Services shall be governed by and
              construed in accordance with the laws of the state of Puerto Rico,
              without giving effect to any principles of conflicts of law. Any
              disputes arising out of or related to these Terms or the Services
              shall be resolved exclusively in the courts located in Lajas,
              Puerto Rico.
            </p>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <CalendarIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Changes to the Terms</h2>
            </div>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. We will notify you of
              any changes by posting the new Terms on our website. Your
              continued use of the Services after any such changes constitutes
              your acceptance of the new Terms.
            </p>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <MailIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground">
              If you have any questions or concerns about these Terms or the way
              we handle your data, please don&apos;t hesitate to contact us at:
            </p>
            <div className="mt-4 space-y-2">
              <p>contact@mech-panicbutton.com</p>
            </div>
          </section>
        </div>
      </main>
      <footer className="px-4 py-6 bg-muted text-muted-foreground md:px-8">
        <div className="container max-w-5xl mx-auto text-sm text-center">
          &copy; 2024 Flabbergasting Games LLC. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}
function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}
function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  )
}
