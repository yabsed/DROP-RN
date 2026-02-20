export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type CommentItem = {
  id: string;
  text: string;
  createdAt: string;
};

export type PostType = "post" | "board";

export type BasePost = {
  id: string;
  type: PostType;
  coordinate: Coordinate;
  emoji: string;
  title: string;
  photo?: string | null;
  createdAt: number;
};

export type NormalPost = BasePost & {
  type: "post";
  content: string;
  comments: CommentItem[];
};

export type BoardPost = {
  id: string;
  emoji?: string;
  title: string;
  content: string;
  photo?: string | null;
  createdAt: number;
  comments: CommentItem[];
};

export type Board = BasePost & {
  type: "board";
  description: string;
  boardPosts: BoardPost[];
};

export type Post = NormalPost | Board;

export type NewPostForm = {
  coordinate: Coordinate | null;
  emoji: string;
  title: string;
  content: string;
  description: string;
  photo: string | null;
  type: PostType;
};

export type NewBoardPostForm = {
  emoji: string;
  title: string;
  content: string;
  photo: string | null;
};
