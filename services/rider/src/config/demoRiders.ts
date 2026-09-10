export type DemoRiderSeed = {
  name: string;
  picture: string;
  bearingDeg: number;
  distanceKm: number;
};

const portrait = (n: number) =>
  `https://randomuser.me/api/portraits/men/${n}.jpg`;

export const DEMO_RIDER_CATALOG: DemoRiderSeed[] = [
  { name: "Arjun Mehta", picture: portrait(11), bearingDeg: 15, distanceKm: 1.6 },
  { name: "Rohit Sharma", picture: portrait(32), bearingDeg: 41, distanceKm: 2.1 },
  { name: "Vikram Singh", picture: portrait(41), bearingDeg: 67, distanceKm: 1.3 },
  { name: "Aditya Kumar", picture: portrait(52), bearingDeg: 93, distanceKm: 2.7 },
  { name: "Karan Malhotra", picture: portrait(60), bearingDeg: 119, distanceKm: 1.9 },
  { name: "Rahul Verma", picture: portrait(68), bearingDeg: 145, distanceKm: 2.4 },
  { name: "Sanjay Patel", picture: portrait(75), bearingDeg: 171, distanceKm: 1.5 },
  { name: "Amit Nair", picture: portrait(83), bearingDeg: 197, distanceKm: 2.9 },
  { name: "Deepak Yadav", picture: portrait(22), bearingDeg: 223, distanceKm: 1.7 },
  { name: "Suresh Reddy", picture: portrait(14), bearingDeg: 249, distanceKm: 2.2 },
  { name: "Manoj Gupta", picture: portrait(5), bearingDeg: 275, distanceKm: 1.4 },
  { name: "Rajesh Iyer", picture: portrait(27), bearingDeg: 301, distanceKm: 2.6 },
  { name: "Nikhil Choudhary", picture: portrait(36), bearingDeg: 327, distanceKm: 1.8 },
  { name: "Vivek Joshi", picture: portrait(45), bearingDeg: 353, distanceKm: 2.3 },
];

const hashDigits = (input: string, length: number) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let digits = "";
  let value = Math.abs(hash);
  while (digits.length < length) {
    digits += String(value % 10);
    value = Math.floor(value / 10);
    if (value === 0) value = Math.abs(Math.imul(hash, 31 + digits.length));
  }
  return digits.slice(0, length);
};

export const demoRiderIdentity = (clusterKey: string, index: number) => ({
  userId: `demo:${clusterKey}:rider:${index}`,
  phoneNumber: `9${hashDigits(`${clusterKey}:${index}:phone`, 9)}`,
  aadharNumber: hashDigits(`${clusterKey}:${index}:aadhar`, 12),
  drivingLicenseNumber: `DL${hashDigits(`${clusterKey}:${index}:dl`, 11)}`,
});
