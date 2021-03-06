import getUserId from '../utils/getUserId';

const Query = {
  users(parent, args, { prisma }, info) {
    const operationArguments = {};

    if (args.query) {
      operationArguments.where = {
        OR: [
          {
            name_contains: args.query,
          },
        ]
      }
    }
    return prisma.query.users(operationArguments, info);
  },

  posts(parent, args, { prisma }, info) {
    const operationalArguments = {
      where: {
        published: true,
      }
    };

    if (args.query) {
      operationalArguments.where.OR = [
        {
          title_contains: args.query,
        },
        {
          body_contains: args.query,
        },
      ]
    }

    return prisma.query.posts(operationalArguments, info);
  },

  myPosts(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const operationalArguments = {
      where: {
        author: {
          id: userId,
        }
      }
    };

    if (args.query) {
      operationalArguments.where.OR = [
        {
          title_contains: args.query,
        },
        {
          body_contains: args.query,
        },
      ]
    }

    return prisma.query.posts(operationalArguments, info);
  },

  comments(parent, args, { prisma }, info) {
    return prisma.query.comments(null, info);
  },

  me(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.query.user({
      where: {
        id: userId,
      }
    })
  },

  async post(parent, args, { prisma, request }, info) {
    const userId = getUserId(request, false);

    const posts = await prisma.query.posts({
      where: {
        id: args.id,
        OR: [
          {
            published: true,
          },
          {
            author: {
              id: userId,
            }
          }
        ]
      }
    }, info);

    if (posts.length === 0) {
      throw new Error('Post not found.');
    }

    return posts[0];
  },
};

export { Query as default };