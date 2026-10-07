/**
 * The club's office bearers, in the order the site shows them (badge numbers
 * follow it). When the council changes hands, replace this list — the Team
 * section renders whatever is here.
 *
 * `photo` is a square head-and-shoulders portrait in public/team/, restyled to
 * the site's palette (black backdrop, red clothing). Anyone without one gets
 * their initials on the badge instead.
 */
export interface OfficeBearer {
  name: string;
  role: string;
  photo?: string;
}

export const OFFICE_BEARERS: OfficeBearer[] = [
  { name: 'Malik Usman', role: 'President', photo: '/team/malik-usman.webp' },
  { name: 'Moteba Rehman', role: 'Vice President', photo: '/team/moteba-rehman.webp' },
  { name: 'Hamza Shah', role: 'Tech Secretary', photo: '/team/hamza-shah.webp' },
  { name: 'Zaki Haider', role: 'Secretary', photo: '/team/zaki-haider.webp' },
  { name: 'Noor Fatima', role: 'Treasurer', photo: '/team/noor-fatima.webp' },
  { name: 'Menahil Arif', role: 'Press Secretary', photo: '/team/menahil-arif.webp' },
];
