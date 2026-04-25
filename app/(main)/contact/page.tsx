"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Thanks! We'll get back to you soon.");
    setName(""); setEmail(""); setSubject(""); setMessage("");
    setLoading(false);
  };

  return (
    <div className="app-page min-h-screen bg-background text-foreground overflow-x-hidden">
      <main className="relative z-10 container mx-auto max-w-4xl p-6 md:p-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-6 bg-card backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[160px]" required /></div>
          <Button type="submit" disabled={loading} className="rounded-xl font-semibold">{loading ? "Sending..." : "Send message"}</Button>
        </form>
      </main>
    </div>
  );
}
