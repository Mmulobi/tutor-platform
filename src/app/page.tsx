"use client"; // Required for styled-jsx in Next.js App Router

import Image from "next/image";
import Link from "next/link";

// Define the images from the public folder
const images = [
  "/student1.jpg",
  "/students.jpg",
  "/tutor.jpg",
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">TutorConnect</h1>
          </div>
          <nav className="hidden md:flex space-x-10 items-center">
            <a href="#features" className="hover:text-blue-200 transition">Features</a>
            <a href="#how-it-works" className="hover:text-blue-200 transition">How It Works</a>
            <a href="#testimonials" className="hover:text-blue-200 transition">Testimonials</a>
            <Link href="/auth/signin" className="bg-white text-blue-600 px-6 py-2 rounded-full font-medium hover:bg-blue-50 transition">
              Sign In
            </Link>
          </nav>
          <div className="md:hidden">
            <button className="text-white focus:outline-none">
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="container mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Connect with Expert Tutors for Personalized Learning
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Find the perfect tutor, schedule sessions, and improve your skills with our modern learning platform.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
              <Link href="/auth/register?role=STUDENT" className="bg-white text-blue-600 px-8 py-3 rounded-full font-medium text-lg hover:bg-blue-50 transition">
                Join as Student
              </Link>
              <Link href="/auth/register?role=TUTOR" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-medium text-lg hover:bg-white/10 transition">
                Become a Tutor
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative h-[500px] w-full">
            {/* Slideshow Container */}
            <div className="relative h-full w-full rounded-lg shadow-xl overflow-hidden">
              {images.map((src, index) => (
                <Image
                  key={index}
                  src={src}
                  alt={`TutorConnect Slide ${index + 1}`}
                  width={600}
                  height={500}
                  className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                    index === 0 ? "opacity-100" : "opacity-0"
                  } animate-slide`}
                  style={{ animationDelay: `${index * 10}s` }} // Staggered animation (0s, 10s, 20s)
                  priority={index === 0} // Load first image with priority
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Why Choose TutorConnect?</h2>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Tutors</h3>
              <p className="text-gray-600">Connect with verified tutors who are experts in their fields, ensuring high-quality learning experiences.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Flexible Scheduling</h3>
              <p className="text-gray-600">Book sessions at times that work for you, with options for one-on-one or group tutoring.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Live Video Sessions</h3>
              <p className="text-gray-600">Engage in real-time video tutoring with integrated chat for an interactive learning experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">How TutorConnect Works</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center space-y-12 md:space-y-0 md:space-x-8">
            <div className="text-center md:w-1/3">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-semibold mb-4">Create Your Profile</h3>
              <p className="text-gray-600">Sign up and create your profile as a student or tutor. Students can specify subjects they need help with, while tutors showcase their expertise.</p>
            </div>
            
            <div className="text-center md:w-1/3">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-semibold mb-4">Find & Book Sessions</h3>
              <p className="text-gray-600">Browse tutors by subject, availability, and ratings. Schedule sessions that fit your calendar and learning needs.</p>
            </div>
            
            <div className="text-center md:w-1/3">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-semibold mb-4">Learn & Grow</h3>
              <p className="text-gray-600">Connect via video calls for personalized tutoring sessions. Message your tutor between sessions for additional support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">What Our Users Say</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white text-gray-800 p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">JS</span>
                </div>
                <div>
                  <h4 className="font-semibold">Jessica Smith</h4>
                  <p className="text-gray-500 text-sm">Student</p>
                </div>
              </div>
              <p className="text-gray-600">"I was struggling with calculus until I found my tutor on TutorConnect. The personalized sessions have helped me improve my grades significantly!"</p>
            </div>
            
            <div className="bg-white text-gray-800 p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">MJ</span>
                </div>
                <div>
                  <h4 className="font-semibold">Michael Johnson</h4>
                  <p className="text-gray-500 text-sm">Tutor</p>
                </div>
              </div>
              <p className="text-gray-600">"As a tutor, TutorConnect has given me the flexibility to teach on my own schedule while connecting me with students who truly value education."</p>
            </div>
            
            <div className="bg-white text-gray-800 p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">AP</span>
                </div>
                <div>
                  <h4 className="font-semibold">Aisha Patel</h4>
                  <p className="text-gray-500 text-sm">Parent</p>
                </div>
              </div>
              <p className="text-gray-600">"My daughter's confidence has grown tremendously since using TutorConnect. The platform is easy to use and the tutors are excellent."</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Join thousands of students and tutors on our platform and start your educational journey today.</p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Link href="/auth/register?role=STUDENT" className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium text-lg hover:bg-blue-700 transition">
              Get Started Now
            </Link>
            <Link href="/auth/signin" className="bg-white border border-blue-600 text-blue-600 px-8 py-3 rounded-full font-medium text-lg hover:bg-blue-50 transition">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TutorConnect</h3>
              <p className="text-gray-400">Connecting students with expert tutors for personalized learning experiences.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Home</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition">How It Works</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Users</h4>
              <ul className="space-y-2">
                <li><Link href="/auth/register?role=STUDENT" className="text-gray-400 hover:text-white transition">Join as Student</Link></li>
                <li><Link href="/auth/register?role=TUTOR" className="text-gray-400 hover:text-white transition">Become a Tutor</Link></li>
                <li><Link href="/auth/signin" className="text-gray-400 hover:text-white transition">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@tutorconnect.com</li>
                <li>+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2025 TutorConnect. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animation Styles */}
      <style jsx global>{`
        @keyframes slide {
          0% { opacity: 0; }
          3.33% { opacity: 1; } /* Fade in starts */
          33.33% { opacity: 1; } /* Fully visible for ~10s */
          36.66% { opacity: 0; } /* Fade out starts */
          100% { opacity: 0; }
        }
        .animate-slide {
          animation: slide 30s infinite; /* Total duration: 30s (10s per image) */
        }
      `}</style>
    </div>
  );
}