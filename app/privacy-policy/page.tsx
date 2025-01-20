import Link from "next/link"

export default function Privacy() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="px-4 py-6 bg-primary text-primary-foreground md:px-8 rounded-b-2xl">
        <div className="container max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-lg text-primary-foreground/80">
            Protecting your data is our top priority.
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
              <LockIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Data Collection</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">What we collect</h3>
                <p className="mt-2 text-muted-foreground">
                  We collect the following information from you:
                </p>
                <ul className="pl-6 mt-4 space-y-2 list-disc">
                  <li>Name and email address</li>
                  <li>Usage data and device information</li>
                  <li>Payment information (if applicable)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold">How we use it</h3>
                <p className="mt-2 text-muted-foreground">
                  We use your data to:
                </p>
                <ul className="pl-6 mt-4 space-y-2 list-disc">
                  <li>Provide and improve our services</li>
                  <li>Communicate with you</li>
                  <li>Analyze usage and trends</li>
                </ul>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <ShieldIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Data Security</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Encryption</h3>
                <p className="mt-2 text-muted-foreground">
                  All data is encrypted in transit and at rest using
                  industry-standard encryption protocols.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Access Controls</h3>
                <p className="mt-2 text-muted-foreground">
                  Access to your data is restricted to authorized personnel
                  only. We have strict access controls and audit logging in
                  place.
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <UsersIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Data Sharing</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Third-Party Providers</h3>
                <p className="mt-2 text-muted-foreground">
                  We may share your data with trusted third-party providers who
                  assist us in operating our services. These providers are
                  subject to strict confidentiality and security requirements.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Legal Requests</h3>
                <p className="mt-2 text-muted-foreground">
                  We may disclose your data if required to do so by law or in
                  the good-faith belief that such action is necessary to comply
                  with legal processes.
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <UserIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Your Rights</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Access and Correction</h3>
                <p className="mt-2 text-muted-foreground">
                  You have the right to access, review, and correct the personal
                  information we have on file for you.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Deletion</h3>
                <p className="mt-2 text-muted-foreground">
                  You may request that we delete your personal information at
                  any time, subject to certain exceptions.
                </p>
              </div>
            </div>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <CalendarIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Updates and Changes</h2>
            </div>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on our
              website. We encourage you to review this policy periodically for
              the latest information on our privacy practices.
            </p>
          </section>
          <section>
            <div className="flex items-center gap-4 mb-6">
              <MailIcon className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground">
              If you have any questions or concerns about our Privacy Policy or
              the way we handle your data, please don&apos;t hesitate to contact
              us at:
            </p>
            <div className="mt-4 space-y-2">
              <p>contact@mech-panicbutton.com</p>
            </div>
          </section>
        </div>
      </main>
      <footer className="px-4 py-6 bg-muted text-muted-foreground md:px-8 rounded-t-2xl">
        <div className="container max-w-5xl mx-auto text-sm text-center">
          &copy; {new Date().getFullYear()} Flabbergasting Games LLC. All rights reserved.
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

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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
