import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { getOptionalSession } from "@/lib/auth/validateSession";
import { BookOpen, GraduationCap, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Home() {
  // Get session if user is authenticated (null if not)
  const authContext = await getOptionalSession();

  // Redirect authenticated users to their appropriate dashboard
  if (authContext) {
    const isAdmin = authContext.roles.includes("admin");
    const isInstructor = authContext.roles.includes("instructor");

    if (isAdmin || isInstructor) {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  // Only unauthenticated users see this page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b backdrop-blur-sm bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CertistryLMS
            </h1>
          </div>
          <AuthButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Professional Certification Training
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Master Your
            </span>
            <br />
            <span className="text-foreground">
              Certification Journey
            </span>
          </h2>

          <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Professional certification training platform designed for IT professionals.
            Track your progress, manage study materials, and achieve your certification goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <a href="/api/auth/signin">Get Started</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to Succeed
          </h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed to help you achieve your certification goals efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Feature 1 */}
          <div className="group space-y-4 p-6 rounded-xl border bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-100 dark:hover:shadow-purple-900/20 transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold">Structured Learning</h4>
            <p className="text-sm text-muted-foreground">
              Organized certification courses with clear learning paths and study materials.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group space-y-4 p-6 rounded-xl border bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold">Progress Tracking</h4>
            <p className="text-sm text-muted-foreground">
              Monitor your study progress with detailed analytics and completion metrics.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group space-y-4 p-6 rounded-xl border bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-100 dark:hover:shadow-purple-900/20 transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold">Multiple Certifications</h4>
            <p className="text-sm text-muted-foreground">
              Access a variety of IT certification programs all in one platform.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group space-y-4 p-6 rounded-xl border bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold">Secure & Reliable</h4>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade security with role-based access control and data protection.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-12 lg:p-16 text-center text-white shadow-2xl">
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Ready to Start Your Certification Journey?
          </h3>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            Join CertistryLMS today and take control of your professional development with our comprehensive certification training platform.
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
            asChild
          >
            <a href="/api/auth/signin">Get Started Now</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>&copy; {new Date().getFullYear()} CertistryLMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
