import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarRange, BedDouble, MessageSquare as MessageSquareStar, BarChart3, Users, TrendingUp, ShieldCheck, Clock, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminHeader } from '@/components/AdminHeader.jsx';
import { AdminFooter } from '@/components/AdminFooter.jsx';

export default function AdminLandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <Helmet>
        <title>Hotel Admin Portal | Management Area</title>
      </Helmet>

      <AdminHeader />

      <main>
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1644473968199-150d0a098163" 
              alt="Luxury hotel reception" 
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-background/90 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <ShieldCheck className="w-4 h-4" />
                Secure Management Portal
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-serif text-foreground leading-tight mb-6 text-balance">
                Hotel Admin <span className="text-primary">Portal</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                Manage your hotel operations efficiently. Oversee reservations, room availability, guest reviews, and revenue analytics from one secure dashboard.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base shadow-lg shadow-primary/20">
                  <Link to="/admin/login">
                    Login to Admin Area
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Requires authorized access
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES OVERVIEW - Bento Grid Approach */}
        <section className="py-24 relative bg-background">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-foreground">Powerful Capabilities</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to run your boutique hotel smoothly, centralized in a single intuitive interface.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 - Spans 2 columns */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: 0.1}} className="md:col-span-2">
                <Card className="h-full bg-secondary/30 border-primary/20 hover:border-primary/50 transition-colors overflow-hidden group">
                  <CardContent className="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 h-full">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CalendarRange className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Booking Management</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Manage reservations, process check-ins and check-outs, and handle cancellations or modifications with real-time syncing.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 2 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: 0.2}}>
                <Card className="h-full bg-card border-border hover:border-primary/30 transition-colors group">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <BedDouble className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Room Management</h3>
                    <p className="text-muted-foreground text-sm mt-auto">Control room allotments, configure seasonal availability, and close dates for maintenance.</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 3 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: 0.3}}>
                <Card className="h-full bg-card border-border hover:border-primary/30 transition-colors group">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <MessageSquareStar className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Guest Reviews</h3>
                    <p className="text-muted-foreground text-sm mt-auto">Monitor guest feedback, approve testimonials, and maintain your property's reputation.</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 4 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: 0.4}}>
                <Card className="h-full bg-card border-border hover:border-primary/30 transition-colors group">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <BarChart3 className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Analytics Dashboard</h3>
                    <p className="text-muted-foreground text-sm mt-auto">View detailed performance metrics, rating distributions, and category trends over time.</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 5 */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: 0.5}}>
                <Card className="h-full bg-card border-border hover:border-primary/30 transition-colors group">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <Users className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Guest Management</h3>
                    <p className="text-muted-foreground text-sm mt-auto">Track guest information, view past stays, and personalize future experiences.</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 6 - Spans 3 columns on large screens */}
              <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: 0.6}} className="lg:col-span-3">
                <Card className="bg-card border-border border-t-2 border-t-primary shadow-lg overflow-hidden group">
                  <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-4">
                        <TrendingUp className="w-3.5 h-3.5" /> Growth
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">Revenue Insights</h3>
                      <p className="text-muted-foreground max-w-2xl leading-relaxed">
                        Monitor occupancy rates, calculate seasonal revenue, and optimize your pricing strategy to maximize profitability. Comprehensive financial reporting built directly into your workflow.
                      </p>
                    </div>
                    <div className="w-full md:w-auto">
                      <Button asChild variant="outline" className="w-full md:w-auto h-12 px-6 border-primary/30 text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                        <Link to="/admin/login">Explore Dashboard</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </section>

        {/* QUICK STATS & BENEFITS SECTION - ZigZag / Mixed Layout */}
        <section className="py-24 bg-card border-y border-border relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Stats Column */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6 text-foreground">Trusted by Leading Properties</h2>
                <p className="text-muted-foreground mb-12 text-lg">Our admin architecture handles massive scale seamlessly, ensuring your data is always accurate and available.</p>
                
                <div className="grid grid-cols-2 gap-6">
                  <StatBox value="12.4k+" label="Bookings Managed" />
                  <StatBox value="98.5%" label="Occupancy Accurary" />
                  <StatBox value="5,420" label="Guest Reviews" />
                  <StatBox value="24/7" label="System Uptime" />
                </div>
              </div>

              {/* Benefits Column */}
              <div className="bg-background rounded-3xl p-8 md:p-10 border border-border shadow-xl">
                <h3 className="text-2xl font-bold font-serif mb-8 text-foreground">Why choose this portal?</h3>
                <div className="space-y-6">
                  <BenefitRow icon={Clock} title="Real-time Sync" desc="Updates propagate instantly across all connected systems." />
                  <BenefitRow icon={ShieldCheck} title="Enterprise Security" desc="Bank-grade encryption and secure authorized access protocols." />
                  <BenefitRow icon={BarChart3} title="Actionable Insights" desc="Turn raw booking data into strategic revenue decisions." />
                  <BenefitRow icon={CheckCircle2} title="Intuitive Design" desc="Zero learning curve. Manage complex operations easily." />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-24 bg-background relative">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-secondary/40 border border-primary/20 rounded-3xl p-12 md:p-16 flex flex-col items-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <Lock className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold font-serif text-foreground mb-6">Ready to manage your hotel?</h2>
                <p className="text-lg text-muted-foreground mb-10 max-w-xl">
                  Access your secure dashboard to oversee bookings, moderate reviews, and optimize your revenue strategy today.
                </p>
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 text-lg shadow-lg shadow-primary/25 w-full sm:w-auto">
                  <Link to="/admin/login">
                    Login to Portal
                  </Link>
                </Button>
                
                <div className="mt-8 pt-8 border-t border-border/50 w-full flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>Need assistance accessing your account?</span>
                  <a href="mailto:support@hoteladmin.com" className="text-primary hover:underline font-medium">Contact IT Support</a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <AdminFooter />
    </div>
  );
}

// Subcomponents for cleaner code
function StatBox({ value, label }) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
      <div className="text-3xl md:text-4xl font-bold text-foreground font-serif mb-2 tabular-nums">{value}</div>
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

function BenefitRow({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h4 className="text-lg font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
      </div>
    </div>
  );
}