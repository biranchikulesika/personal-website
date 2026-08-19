'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ProfilePageJsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/config/seo';

export default function WandererAboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 pt-8 pb-20 md:pt-10 md:pb-32 relative flex flex-col font-spectral">
      <ProfilePageJsonLd
        description="Journeys, stories, memory, travel, lived moments, observations, and fragments collected along the way."
        url={`${SITE_URL}/wanderer/about`}
        image={`${SITE_URL}/images/og-fallback-wanderer.png`}
      />
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl"
      >
        <div className="mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl italic text-heading font-cormorant tracking-tight">
            Why Scribble Exists
          </h1>
        </div>
        
        <div className="space-y-8 md:space-y-12 text-body leading-relaxed text-[15px] md:text-lg font-light">
          <p>
            Wanderer is where stories, memories, lived moments, observations, and fragments of life are quietly collected and preserved. Some things feel too human to disappear into timelines and temporary posts.
          </p>
          <p>
            This space exists to document places, conversations, moods, journeys, and moments that stay longer than expected. It is less about performance and more about remembering things honestly before they fade with time.
          </p>
          <p>
            I enjoy observing people, collecting emotional details, writing things down, and turning fleeting experiences into stories that can survive a little longer.
          </p>
          
          <div className="pt-8 md:pt-12">
            <p className="text-sm md:text-base text-accent-text tracking-wide font-cormorant italic opacity-90">
              Some moments deserve a quieter archive.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
