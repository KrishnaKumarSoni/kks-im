// Board Posts Management System
// Use global Firebase from CDN instead of ES modules

class BoardPostsManager {
  constructor() {
    this.postsContainer = document.getElementById('postsContainer');
    this.loadingElement = document.getElementById('postsLoading');
    this.sortSelect = document.getElementById('sortSelect');
    this.posts = [];
    this.currentSort = 'newest';
    
    // Get Firebase from global scope
    this.db = window.firebaseDb;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadPosts();
  }

  setupEventListeners() {
    // Sort functionality
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.sortAndDisplayPosts();
      });
    }
  }

  async loadPosts() {
    try {
      this.showLoading(true);
      
      // Setup real-time listener using compat API
      const postsQuery = this.db.collection('posts').orderBy('createdAt', 'desc');
      
      postsQuery.onSnapshot((snapshot) => {
        this.posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.sortAndDisplayPosts();
        this.showLoading(false);
      });
      
    } catch (error) {
      console.error('Error loading posts:', error);
      this.showError('Failed to load posts');
    }
  }

  sortAndDisplayPosts() {
    let sortedPosts = [...this.posts];
    
    switch (this.currentSort) {
      case 'oldest':
        sortedPosts.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
        break;
      case 'upvotes':
        sortedPosts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        break;
      case 'comments':
        sortedPosts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      default: // newest
        sortedPosts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    }
    
    this.displayPosts(sortedPosts);
    this.updatePostsCount(this.posts.length);
  }

  displayPosts(posts) {
    if (!this.postsContainer) return;
    
    if (posts.length === 0) {
      this.postsContainer.innerHTML = `
        <div class="no-posts-message">
          <div class="no-posts-icon">🛠️</div>
          <h3>No Engineering Insights Yet</h3>
          <p>The board is ready for technical discussions and problem-solving insights.</p>
        </div>
      `;
      return;
    }

    this.postsContainer.innerHTML = posts.map(post => this.createPostCard(post)).join('');
    this.attachPostEventListeners();
  }

  createPostCard(post) {
    const timeAgo = this.formatTimeAgo(post.createdAt);
    const tags = post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : '';
    
    return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-meta">
            <span class="post-author">Krishna Kumar Soni</span>
            <span class="post-time">${timeAgo}</span>
          </div>
        </div>
        
        ${post.title ? `<h2 class="post-title">${post.title}</h2>` : ''}
        
        <div class="post-content">
          ${this.formatPostContent(post.content)}
        </div>
        
        ${tags ? `<div class="post-tags">${tags}</div>` : ''}
        
        <div class="post-actions">
          <button class="action-btn upvote-btn ${this.hasUserUpvoted(post.id) ? 'active' : ''}" 
                  data-post-id="${post.id}">
            <span class="material-icons">keyboard_arrow_up</span>
            <span class="upvote-count">${post.upvotes || 0}</span>
          </button>
          
          <button class="action-btn comment-btn" data-post-id="${post.id}">
            <span class="material-icons">comment</span>
            <span class="comment-count">${post.commentCount || 0}</span>
          </button>
          
          <button class="action-btn share-btn" data-post-id="${post.id}">
            <span class="material-icons">share</span>
          </button>
        </div>
        
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
          <div class="comments-loading">Loading comments...</div>
        </div>
      </article>
    `;
  }

  formatPostContent(content) {
    // Basic formatting for line breaks and code blocks
    return content
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([^```]+)```/g, '<pre><code>$1</code></pre>');
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const postTime = timestamp.toDate();
    const diffMs = now - postTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return postTime.toLocaleDateString();
  }

  attachPostEventListeners() {
    // Upvote buttons
    document.querySelectorAll('.upvote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.toggleUpvote(postId);
      });
    });

    // Comment buttons
    document.querySelectorAll('.comment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.toggleComments(postId);
      });
    });

    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.sharePost(postId);
      });
    });
  }

  async toggleUpvote(postId) {
    try {
      const hasUpvoted = this.hasUserUpvoted(postId);
      const postRef = this.db.collection('posts').doc(postId);
      
      if (hasUpvoted) {
        // Remove upvote
        await postRef.update({
          upvotes: firebase.firestore.FieldValue.increment(-1)
        });
        this.removeUserUpvote(postId);
      } else {
        // Add upvote
        await postRef.update({
          upvotes: firebase.firestore.FieldValue.increment(1)
        });
        this.addUserUpvote(postId);
      }
      
      // Update UI optimistically
      this.updateUpvoteUI(postId, !hasUpvoted);
      
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  }

  hasUserUpvoted(postId) {
    const upvoted = JSON.parse(localStorage.getItem('upvotedPosts') || '[]');
    return upvoted.includes(postId);
  }

  addUserUpvote(postId) {
    const upvoted = JSON.parse(localStorage.getItem('upvotedPosts') || '[]');
    upvoted.push(postId);
    localStorage.setItem('upvotedPosts', JSON.stringify(upvoted));
  }

  removeUserUpvote(postId) {
    const upvoted = JSON.parse(localStorage.getItem('upvotedPosts') || '[]');
    const filtered = upvoted.filter(id => id !== postId);
    localStorage.setItem('upvotedPosts', JSON.stringify(filtered));
  }

  updateUpvoteUI(postId, isUpvoted) {
    const btn = document.querySelector(`[data-post-id="${postId}"].upvote-btn`);
    if (btn) {
      btn.classList.toggle('active', isUpvoted);
    }
  }

  toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection.style.display === 'none') {
      commentsSection.style.display = 'block';
      this.loadComments(postId);
    } else {
      commentsSection.style.display = 'none';
    }
  }

  async loadComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    
    try {
      const commentsQuery = this.db.collection('comments').orderBy('createdAt', 'asc');
      
      const snapshot = await commentsQuery.get();
      const comments = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(comment => comment.postId === postId);
      
      this.displayComments(postId, comments);
      
    } catch (error) {
      console.error('Error loading comments:', error);
      commentsSection.innerHTML = '<div class="error-message">Failed to load comments</div>';
    }
  }

  displayComments(postId, comments) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    
    const commentForm = `
      <div class="comment-form">
        <textarea placeholder="Share your thoughts..." id="comment-input-${postId}"></textarea>
        <div class="comment-form-meta">
          <input type="text" placeholder="Your name (optional)" id="comment-name-${postId}">
          <button class="submit-comment-btn" onclick="boardPosts.submitComment('${postId}')">
            Post Comment
          </button>
        </div>
      </div>
    `;
    
    const commentsHtml = comments.map(comment => `
      <div class="comment">
        <div class="comment-header">
          <span class="comment-author">${comment.authorName || 'Anonymous'}</span>
          <span class="comment-time">${this.formatTimeAgo(comment.createdAt)}</span>
        </div>
        <div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');
    
    commentsSection.innerHTML = commentForm + '<div class="comments-list">' + commentsHtml + '</div>';
  }

  async submitComment(postId) {
    const contentInput = document.getElementById(`comment-input-${postId}`);
    const nameInput = document.getElementById(`comment-name-${postId}`);
    
    const content = contentInput.value.trim();
    if (!content) return;
    
    try {
      // Add comment to Firestore
      await this.db.collection('comments').add({
        postId: postId,
        content: content,
        authorName: nameInput.value.trim() || 'Anonymous',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        approved: true // Auto-approve for MVP
      });
      
      // Update post comment count
      const postRef = this.db.collection('posts').doc(postId);
      await postRef.update({
        commentCount: firebase.firestore.FieldValue.increment(1)
      });
      
      // Clear form and reload comments
      contentInput.value = '';
      nameInput.value = '';
      this.loadComments(postId);
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }

  sharePost(postId) {
    const url = `${window.location.origin}/board#post-${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Engineering Insight',
        url: url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        this.showNotification('Link copied to clipboard!');
      });
    }
  }

  showLoading(show) {
    if (this.loadingElement) {
      this.loadingElement.style.display = show ? 'block' : 'none';
    }
  }

  showError(message) {
    if (this.postsContainer) {
      this.postsContainer.innerHTML = `
        <div class="error-message">
          <span class="material-icons">error</span>
          <p>${message}</p>
        </div>
      `;
    }
  }

  showNotification(message) {
    // Create and show notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  updatePostsCount(count) {
    const countElement = document.getElementById('postsCount');
    if (countElement) {
      countElement.textContent = count.toString().padStart(2, '0');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.boardPosts = new BoardPostsManager();
}); 