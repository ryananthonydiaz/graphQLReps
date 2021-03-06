import { v4 as uuidv4 } from 'uuid';

const Mutation = {
  createUser(parent, args, { db }, info) {
    const emailTaken = db.users.some(user => user.email.toLowerCase() === args.data.email.toLowerCase());

    if (emailTaken) {
      throw new Error('Email taken.');
    }

    const user = {
      id: uuidv4(),
      ...args.data,
    };

    db.users.push(user);

    return user;
  },

  deleteUser(parent, args, { db }, info) {
    const userIndex = db.users.findIndex(user => user.id === args.id);

    if (userIndex === -1) {
      throw new Error('user not found.');
    }

    const deletedUsers = users.splice(userIndex, 1);

    db.posts = db.posts.filter(post => {
      const match = post.author === args.id;

      if (match === true) {
        // Deleting all comments left on a post published by the user the request to delete is for.
        db.comments = db.comments.filter(comment => comment.post !== post.id)
      }

      return !match;
    });

    // Deleting all comments on any posts that is published by the user the request to delete is for.
    db.comments = db.comments.filter(comment => comment.author !== args.id)

    // Returns the deleted user
    return deletedUsers[0];
  },

  updateUser(parent, args, { db }, info) {
    const { id, data } = args;
    const user = db.users.find(user => user.id === id);

    if (!user) {
      throw new Error('User not found');
    }

    if (typeof data.email === 'string') {
      const emailTaken = db.users.some(user => user.email === data.email)

      if (emailTaken) {
        throw new Error('Email taken');
      }

      user.email = data.email;
    }

    if (typeof data.name === 'string') {
      user.name = data.name
    }

    if (typeof data.age !== 'undefined') {
      user.age = data.age;
    }

    return user;
  },

  createPost(parent, args, { pubsub, db }, info) {
    const userExists = db.users.some(user => user.id === args.data.author);

    if (!userExists) {
      throw new Error('User not found..');
    }

    const post = {
      id: uuidv4(),
      ...args.data,
    };

    db.posts.push(post);

    if (post.published === true) {
      pubsub.publish('post', {
        post: {
          mutation: 'CREATED',
          data: post,
        }
      });
    }

    return post;
  },

  deletePost(parent, args, { pubsub, db }, info) {
    const postIndex = db.posts.findIndex(post => post.id === args.id);

    if (postIndex === -1) {
      throw new Error('Post not found...')
    }

    db.comments = db.comments.filter(comment => comment.post !== args.id);

    const [ post ] = db.posts.splice(postIndex, 1);

    if (post.published === true) {
      pubsub.publish('post', {
        post: {
          mutation: 'DELETED',
          data: post,
        }
      });
    }

    return post;
  },

  updatePost(parent, args, { pubsub, db }, info) {
    const { id, data } = args;
    const post = db.posts.find(post => post.id === id);
    const originalPost = { ...post }

    if (!post) {
      throw new Error('This post does not exist.');
    }

    if (typeof data.title === 'string') {
      post.title = data.title;
    };

    if (typeof data.body === 'string') {
      post.body = data.body;
    };

    if (typeof data.published === 'boolean') {
      post.published = data.published;

      if (originalPost.published && post.published === false) {
        pubsub.publish('post', {
          post: {
            mutation: 'DELETED',
            data: originalPost,
          }
        });
      } else if (originalPost === false && post.published === true) {
        pubsub.publish('post', {
          post: {
            mutation: 'CREATED',
            data: post,
          }
        });
      }
    } else {
      pubsub.publish('post', {
        post: {
          mutation: 'UPDATED',
          data: post,
        }
      });
    }

    db.posts.push(post);

    return post;
  },

  createComment(parent, args, { pubsub, db }, info) {
    const { textField, author, post } = args.data;

    const userExists = db.users.some(user => user.id === author);
    const postExists = db.posts.some(pst => pst.id === post && pst.published);

    if (!postExists || !userExists) {
      return new Error('Could not find user and/or post...');
    };

    const newComment = {
      id: uuidv4(),
      textField,
      author,
      post,
    };

    db.comments.push(newComment);
    pubsub.publish(`comment ${post}`, {
      comment: {
        mutation: 'CREATED',
        data: newComment,
      }
    });

    return newComment;
  },

  deleteComment(parent, args, { pubsub, db }, info) {
    const commentIndex = db.comments.findIndex(comment => comment.id === args.id);

    if (commentIndex === -1) {
      throw new Error('Comment not found...');
    }

    const [ comment ] = db.comments.splice(commentIndex, 1);

    pubsub.publish(`comment ${comment.post}`, {
      comment: {
        mutation: 'DELETED',
        data: comment,
      }
    })

    return comment;
  },

  updateComment(parent, args, { pubsub, db }, info) {
    const { id, data } = args;

    const comment = db.comments.find(comment => comment.id === id);

    if (!comment) {
      throw new Error('This comment was not found.');
    };

    if (typeof data.textField !== 'string') {
      throw new Error('TextField is required.');
    }

    comment.textField = data.textField;

    db.comments.push(comment);

    pubsub.publish(`comment ${comment.post}`, {
      comment: {
        mutation: 'UPDATED',
        data: comment,
      }
    })

    return comment;
  }
};

export { Mutation as default };
