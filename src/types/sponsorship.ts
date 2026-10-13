export interface Sponsorship {
  id: string;
  placementId: string;
  sponsorName: string;
  description: string;
  destinationUrl: string;
  logoUrl?: string;
  status: 'pending' | 'active' | 'paused' | 'expired';
  startsAt?: string;
  expiresAt?: string;
}
