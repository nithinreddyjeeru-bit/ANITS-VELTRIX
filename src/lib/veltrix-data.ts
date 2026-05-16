export const stats = [
  { icon: "EV", value: "50+", label: "Events" },
  { icon: "ST", value: "5000+", label: "Students" },
  { icon: "CL", value: "25+", label: "Clubs" },
  { icon: "XP", value: "100+", label: "Achievements" },
];

export const categories = ["All", "Hackathon", "Robotics", "Creative", "Cultural", "Gaming", "Business"];

export const events = [
  {
    id: "veltrix-tech-fest",
    title: "Code Wars",
    type: "Hackathon",
    categoryIcon: "</>",
    date: "25 - 26 May, 2026",
    time: "36 hour sprint",
    venue: "Innovation Arena",
    color: "#7b2cff",
    status: "Filling fast",
    participants: "1,248",
    seats: "1,500",
    countdown: "12D 08H",
    xp: "5200 XP",
    copy: "Squad-based coding battles, mentor rooms, and live demo voting.",
    speakers: ["Ananya Rao", "Kiran Dev", "Prof. Mehta"],
    rewards: ["Winner trophy", "Verified certificate", "Club XP boost", "Sponsor shortlist"],
    timeline: ["Register squad", "Check in", "Build sprint", "Demo battle", "Certificate drop"],
    faq: ["Can solo students join?", "Yes, we match solo players with open squads."],
  },
  {
    id: "robotix-challenge",
    title: "Robotix Challenge",
    type: "Robotics",
    categoryIcon: "BOT",
    date: "28 May, 2026",
    time: "10 AM",
    venue: "Mech Lab",
    color: "#ff3131",
    status: "Live trials",
    participants: "640",
    seats: "800",
    countdown: "15D 02H",
    xp: "3400 XP",
    copy: "Autonomous bots, arena missions, and rapid hardware rounds.",
    speakers: ["Dr. Kavya Sen", "Rohit Varma"],
    rewards: ["Arena medal", "Hardware badge", "Certificate"],
    timeline: ["Bot check", "Arena run", "Repair window", "Final race"],
    faq: ["Are kits provided?", "Teams can bring kits; limited lab kits are available."],
  },
  {
    id: "design-arena",
    title: "Design Arena",
    type: "Creative",
    categoryIcon: "UI",
    date: "30 May, 2026",
    time: "2 PM",
    venue: "Design Studio",
    color: "#0057ff",
    status: "New drop",
    participants: "520",
    seats: "700",
    countdown: "17D 04H",
    xp: "2200 XP",
    copy: "Poster sprints, UI battles, and campus creator showcases.",
    speakers: ["Mira Joseph", "Arjun B"],
    rewards: ["Creator badge", "Gallery feature", "Certificate"],
    timeline: ["Brief reveal", "Design sprint", "Peer vote", "Showcase"],
    faq: ["Which tools are allowed?", "Any design tool is welcome."],
  },
  {
    id: "cultural-night",
    title: "Cultural Night",
    type: "Cultural",
    categoryIcon: "MIC",
    date: "01 Jun, 2026",
    time: "6 PM",
    venue: "Open Air Stage",
    color: "#ffd400",
    status: "Crowd vote",
    participants: "2,890",
    seats: "3,200",
    countdown: "19D 10H",
    xp: "1800 XP",
    copy: "Dance, music, fashion, crowd voting, and spotlight moments.",
    speakers: ["Student Council", "Cultural Crew"],
    rewards: ["Spotlight pass", "Performer badge", "Certificate"],
    timeline: ["Crew check", "Stage run", "Live voting", "Finale"],
    faq: ["Can guests attend?", "Guest passes open after student registration."],
  },
  {
    id: "bgmi-tournament",
    title: "BGMI Tournament",
    type: "Gaming",
    categoryIcon: "GG",
    date: "02 Jun, 2026",
    time: "4 PM",
    venue: "Esports Room",
    color: "#1dc75b",
    status: "Squads open",
    participants: "1,180",
    seats: "1,400",
    countdown: "20D 03H",
    xp: "3100 XP",
    copy: "Squad brackets, live shoutcasting, and rank rewards.",
    speakers: ["Esports Nexus", "Campus Casters"],
    rewards: ["Winner crate", "Rank badge", "Certificate"],
    timeline: ["Squad lock", "Qualifiers", "Semi finals", "Final room"],
    faq: ["How many per squad?", "Four players plus one optional substitute."],
  },
  {
    id: "startup-blitz",
    title: "Startup Blitz",
    type: "Business",
    categoryIcon: "$",
    date: "05 Jun, 2026",
    time: "11 AM",
    venue: "Incubation Bay",
    color: "#ff8a00",
    status: "Pitch deck",
    participants: "420",
    seats: "500",
    countdown: "23D 06H",
    xp: "2600 XP",
    copy: "Pitch decks, founder stories, and investor-style feedback.",
    speakers: ["Founder Cell", "Alumni Angels"],
    rewards: ["Founder badge", "Mentor session", "Certificate"],
    timeline: ["Idea note", "Pitch room", "Feedback", "Shortlist"],
    faq: ["Do we need a company?", "No, student ideas and prototypes are welcome."],
  },
];

export const registrationSteps = [
  "Choose an event",
  "Register or save",
  "Get notification",
  "Attend and earn XP",
  "Claim certificate",
];

export const features = [
  {
    icon: "REG",
    title: "Easy registration",
    copy: "Register for events in a few clear clicks.",
  },
  {
    icon: "CERT",
    title: "Certificates",
    copy: "Earn digital certificates and showcase wins.",
  },
  {
    icon: "RANK",
    title: "Leaderboard",
    copy: "Compete, earn points, and climb campus ranks.",
  },
  {
    icon: "BADGE",
    title: "Achievements",
    copy: "Unlock badges and exclusive rewards.",
  },
  {
    icon: "BELL",
    title: "Stay updated",
    copy: "Get instant updates about events and announcements.",
  },
];

export const clubs = [
  { title: "Coding Club", copy: "Build nights, contests, peer learning.", color: "#0057ff" },
  { title: "Robotics Club", copy: "Bots, sensors, hardware missions.", color: "#ff3131" },
  { title: "Dance Club", copy: "Crews, rehearsals, cultural battles.", color: "#7b2cff" },
  { title: "Esports Club", copy: "Tournaments, scrims, live streams.", color: "#1dc75b" },
  { title: "Photography", copy: "Campus stories, reels, galleries.", color: "#ffd400" },
];

export const leaderboard = [
  { rank: "#1", name: "Aarav", guild: "Coding Club", xp: "98,200 XP" },
  { rank: "#2", name: "Nisha", guild: "Dance Club", xp: "94,100 XP" },
  { rank: "#3", name: "Rehan", guild: "Esports Club", xp: "88,950 XP" },
  { rank: "#12", name: "You", guild: "Robotics Club", xp: "64,500 XP" },
];

export const activity = [
  "Registered for Code Wars",
  "Certificate minted: Design Arena",
  "Saved BGMI Tournament",
  "Moved to rank #12",
];

export const notifications = [
  "Code Wars registration closes in 12 hours.",
  "Robotics Club approved your squad.",
  "Your Design Arena certificate is ready.",
];

export const quickItems = [
  { title: "Announcements", copy: "Fresh campus updates with clean priority labels.", color: "#0057ff" },
  { title: "Certificates", copy: "Verified event proof for your profile.", color: "#ffd400" },
  { title: "Profile XP", copy: "Badges, ranks, streaks, and activity.", color: "#ff3131" },
  { title: "Settings", copy: "Manage alerts, privacy, and account details.", color: "#1dc75b" },
];

export const missions = [
  {
    title: "Register for Code Wars",
    copy: "Reserve a seat, invite a squad, and unlock the event room.",
    href: "/events/veltrix-tech-fest",
    status: "Priority",
  },
  {
    title: "Claim Design Arena certificate",
    copy: "Certificate is ready in your wallet with shareable proof.",
    href: "/certificates",
    status: "Ready",
  },
  {
    title: "Climb to top 10",
    copy: "Attend one event and complete your profile to gain 1,200 XP.",
    href: "/leaderboard",
    status: "XP boost",
  },
];

export const certificates = [
  {
    title: "Code Wars Finalist",
    event: "Code Wars",
    issueDate: "26 May, 2026",
    status: "Locked until event ends",
    color: "#7b2cff",
  },
  {
    title: "Design Arena Winner",
    event: "Design Arena",
    issueDate: "30 May, 2026",
    status: "Ready to download",
    color: "#0057ff",
  },
  {
    title: "Robotix Arena",
    event: "Robotix Challenge",
    issueDate: "28 May, 2026",
    status: "Verification pending",
    color: "#ff3131",
  },
];

export const onboardingSteps = [
  "Choose role",
  "Verify OTP",
  "Pick interests",
  "Open dashboard",
];
