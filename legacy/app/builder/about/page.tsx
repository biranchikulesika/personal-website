'use client';

import { motion } from 'motion/react';
import { ProfilePageJsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/config/seo';

export default function BuilderAboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 pt-8 pb-20 md:pt-10 md:pb-32 relative flex flex-col">
      <ProfilePageJsonLd
        description="Systems, code, workflows, experimentation, and the process of building things carefully over time."
        url={`${SITE_URL}/builder/about`}
        image={`${SITE_URL}/images/og-fallback-builder.png`}
      />
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-xl"
      >
        <div className="mb-10 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-heading tracking-tight">
            Why Forge exists
          </h1>
        </div>
        
        <div className="space-y-7 md:space-y-9 text-body leading-[1.85] md:leading-[1.95] text-[15px] md:text-[16px]">
          <p>
            Forge is where I think through systems, workflows, infrastructure, programming, and the process of building things carefully over time. Most of what exists here comes from curiosity, experimentation, and trying to understand how things work beneath the surface.
          </p>
          <p>
            I enjoy simplifying complexity, documenting processes, refining workflows, and turning vague ideas into usable systems. This corner exists as a long-term archive of things I build, break, learn, and improve slowly.
          </p>
          <div className="pt-8 md:pt-12">
            <p className="text-[13.5px] md:text-[14.5px] text-body/70 tracking-wide font-light">
              Some ideas only make sense once they are built.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
