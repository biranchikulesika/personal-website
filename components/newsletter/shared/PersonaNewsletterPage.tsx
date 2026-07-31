'use client';

import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { createNewsletterPage } from './createNewsletterPage';

// Named exports for each persona - used by the 4 page files
export const BuilderNewsletterPage = createNewsletterPage('builder');
export const OperatorNewsletterPage = createNewsletterPage('operator');
export const ThinkerNewsletterPage = createNewsletterPage('thinker');
export const WandererNewsletterPage = createNewsletterPage('wanderer');
