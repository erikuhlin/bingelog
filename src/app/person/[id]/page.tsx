import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPersonDetails, getPersonGroupedCredits } from '@/lib/tmdb';
import PersonDetailClient from '@/components/PersonDetailClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return { title: 'Person | Bingelog' };
  }

  const person = await getPersonDetails(numericId);
  if (!person) {
    return { title: 'Person hittades inte | Bingelog' };
  }

  return {
    title: `${person.name} – Filmer och serier | Bingelog`,
    description:
      person.biography?.slice(0, 160) ||
      `Utforska alla filmer, serier och produktioner med ${person.name} på Bingelog.`,
  };
}

export default async function PersonPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    notFound();
  }

  const person = await getPersonDetails(numericId);
  if (!person) {
    notFound();
  }

  const credits = await getPersonGroupedCredits(numericId);

  return <PersonDetailClient person={person} credits={credits} />;
}
