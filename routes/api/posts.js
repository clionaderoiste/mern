const express = require('express');
const router = express.Router();

const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route    POST api/posts
//@desc     Create a post
//@access   Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password'); //we don't want the password back so we deselect the password

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      //save the post to the db and wait for it to resolve
      const post = await newPost.save();
      //once we get the post back send it as the response
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route    GET api/posts
//@desc     Get all posts
//@access   Private
router.get('/', auth, async (req, res) => {
  try {
    //sort -1
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

//@route    GET api/posts/:id
//@desc     Get post by id
//@access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    //sort -1
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    //if what they pass in as an id is not a valid id
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route    DELETE api/posts/:id
//@desc     Delete a post
//@access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //If the post doesn't exist
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    //we want to make sure the user deleting the post is the owner of the post
    //Check the user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (error) {
    console.error(error.message);
    //if what they pass in as an id is not a valid id
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/like/:id
//@desc     Like a post
//@access   Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //check if the post has already been linked by the user
    //we want to check all the likes that the post has to see if the user(like.user) matches the logged in user(req.user.id)
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

//@route    PUT api/posts/unlike/:id
//@desc     Remove a like from a post
//@access   Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //check if the post has already been linked by the user
    //we want to check all the likes that the post has to see if the user(like.user) matches the logged in user(req.user.id)
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    //Get the remove index of the like made by the user
    //map over the user filed of the likes, turning to string for matching
    //get the index of the one that matches the user of the request
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

//@route    POST api/posts/comment/:id
//@desc     Comment on a post
//@access   Private
router.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password'); //we don't want the password back so we deselect the password

      const post = await Post.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };
      post.comments.unshift(newComment);
      await post.save();

      //once we get the post back send it as the response
      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route    DELETE api/posts/comment/:id/:comment_id
//@desc     Delete a comment from a post
//@access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    //get the post
    const post = await Post.findById(req.params.id);
    //get the comment from the post
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    //make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }
    //check that user trying to delete the comment made the comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json('User not authorized');
    }

    //Get the remove index of the comment made by the user
    //map over the user filed of the comments, turning to string for matching
    //get the index of the one that matches the user of the request
    const removeIndex = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);
    //remove the 1 comment at the given index
    post.comments.splice(removeIndex, 1);

    //save the post and send the comment back
    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
