import prismaClient from '../src/config/db.config.js';
import { serverConfig } from '../src/config/index.js';
import { SwipeDirection } from '../src/generated/prisma/client.js';
import { avatarUrl, DEMO_USER, SEED_PROFILES } from './seed-data.js';

// wipes the database and loads the demo data
async function seed() {
  if (serverConfig.NODE_ENV === 'production') {
    throw new Error('Not seeding a production database');
  }

  const meId = serverConfig.CURRENT_USER_ID;

  await prismaClient.user.deleteMany(); // cascades to swipes and matches

  await prismaClient.user.create({
    data: {
      ...DEMO_USER,
      id: meId,
      birthDate: new Date(DEMO_USER.birthDate),
      photoUrl: avatarUrl(DEMO_USER.name, 0),
    },
  });

  for (const [i, { likesYou, passedYou, ...profile }] of SEED_PROFILES.entries()) {
    const user = await prismaClient.user.create({
      data: {
        ...profile,
        birthDate: new Date(profile.birthDate),
        photoUrl: avatarUrl(profile.name, i),
      },
    });

    if (likesYou || passedYou) {
      await prismaClient.swipe.create({
        data: {
          swiperId: user.id,
          targetId: meId,
          direction: likesYou ? SwipeDirection.LIKE : SwipeDirection.PASS,
        },
      });
    }
  }

  const likers = SEED_PROFILES.filter((p) => p.likesYou).length;
  console.log(`Seeded ${SEED_PROFILES.length} profiles, ${likers} of them already liked you`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prismaClient.$disconnect());
