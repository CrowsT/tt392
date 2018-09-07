import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import gql from 'graphql-tag';
import qs from 'qs';

import MainContent from 'styles/MainContent';
import Post from 'components/Post';
import Query from 'components/Query';
import Store from 'providers/Store';
import colors from 'utils/colors';

import ChatBubble from 'components/icons/ChatBubble';

// TODO: duplicated to ThreadList/index.js
const FloatBtn = styled.button`
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: ${colors.buttonBg};
  color: white;
  border: none;
  outline: none;
  font-size: 1em;
  line-height: 0;
  cursor: pointer;
  box-shadow: 0 6px 10px 0 rgba(0,0,0,0.14),0 1px 18px 0 rgba(0,0,0,0.12),0 3px 5px -1px rgba(0,0,0,0.2);
`;

const ThreadViewWrapper = styled.div`
  background-color: white;
  border-radius: 16px;
`;

const THREAD_VIEW = gql`
  query Thread($id: String!) {
    thread(id: $id) {
      id, anonymous, title, author, content, createTime, mainTag, subTags,
      replies(query: { after: "", limit: 100}) {
        posts {
          id, anonymous, author, content, createTime, refers { id, author, content, createTime }
        }
        sliceInfo {
          firstCursor
          lastCursor
        }
      }
    }
  }
`;

class ThreadView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      quotedPosts: new Set(),
    };
    this.handleQuoteToggle = this.handleQuoteToggle.bind(this);
  }

  handleQuoteToggle({ postID }) {
    this.setState((prevState) => {
      const newQuotedPosts = new Set(prevState.quotedPosts);
      if (newQuotedPosts.has(postID)) {
        newQuotedPosts.delete(postID);
      } else {
        newQuotedPosts.add(postID);
      }
      return {
        quotedPosts: newQuotedPosts,
      };
    });
  }

  render() {
    return (
      <Query query={THREAD_VIEW} variables={{ id: this.props.match.params.id }}>
        {({
          data, refetch,
        }) => {
          if ((this.props.location.state || {}).reload) {
            refetch();
          }
          const { thread } = data;
          const { quotedPosts } = this.state;
          const replies = (thread.replies || []).posts || [];
          const addReply = () => {
            const quotedQs = qs.stringify({ p: [...quotedPosts] });
            this.props.history.push(`/draft/post/?reply=${this.props.match.params.id}&${quotedQs}`);
          };
          return (
            <MainContent>
              <ThreadViewWrapper>
                <Post isThread {...thread} />
                {replies.map(post =>
                  (<Post
                    key={post.id}
                    isThread={false}
                    postID={post.id}
                    onQuoteToggle={this.handleQuoteToggle}
                    isQuoted={quotedPosts.has(post.id)}
                    quotable={quotedPosts.size < 3}
                    {...post}
                  />))}
                <FloatBtn onClick={addReply}>
                  <ChatBubble />
                </FloatBtn>
              </ThreadViewWrapper>
            </MainContent>
          );
        }}
      </Query>
    );
  }
}

ThreadView.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  location: PropTypes.shape().isRequired,
  setStore: PropTypes.func.isRequired,
};

export default props => (
  <Store.Consumer>
    {({ setStore }) => (
      <ThreadView {...props} setStore={setStore} />
    )}
  </Store.Consumer>
);
