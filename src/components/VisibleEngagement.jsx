import { AuraCard, BuddyMatchingCard, StreakCard } from './EngagementCards';

export function DashboardEngagement({ streak, latestMood }) {
  return (
    <div className="grid three engagementGrid">
      <StreakCard streak={streak} />
      <AuraCard score={Number(latestMood)} />
      <BuddyMatchingCard />
    </div>
  );
}

export function MoodAuraPreview({ moodScore }) {
  return <AuraCard score={Number(moodScore)} />;
}
