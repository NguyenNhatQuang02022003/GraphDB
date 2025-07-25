const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const playground = require('graphql-playground-middleware-express').default;
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

let books = [
  { id: 1, title: 'Clean Code', author: 'Robert C. Martin' },
  { id: 2, title: 'You Don’t Know JS', author: 'Kyle Simpson' },
  { id: 3, title: 'The Pragmatic Programmer', author: 'Andy Hunt & Dave Thomas' },
];
let nextId = 4;

const schema = buildSchema(`
  type Book {
    id: Int!
    title: String!
    author: String!
  }

  input BookInput {
    title: String!
    author: String!
  }

  type Query {
    hello: String
    books: [Book]
    getBookById(id: Int!): Book
  }

  type Mutation {
    addBook(input: BookInput!): Book
    updateBook(id: Int!, input: BookInput!): Book
    deleteBook(id: Int!): String
  }
`);

const root = {
  hello: () => 'Hello từ GraphQL',

  books: () => books,
  
  getBookById: ({ id }) => books.find(book => book.id === id),

  addBook: ({ input }) => {
    const newBook = { id: nextId++, ...input };
    books.push(newBook);
    return newBook;
  },

  updateBook: ({ id, input }) => {
    const index = books.findIndex(book => book.id === id);
    if (index === -1) throw new Error('Không tìm thấy sách.');
    books[index] = { ...books[index], ...input };
    return books[index];
  },

  deleteBook: ({ id }) => {
    const index = books.findIndex(book => book.id === id);
    if (index === -1) throw new Error('Không tìm thấy sách.');
    books.splice(index, 1);
    return 'Đã xóa sách có id = ' + id;
  }
  
};

app.use('/graphql', graphqlHTTP({  schema: schema,  rootValue: root,  graphiql: false,}));

app.get('/playground', playground({ endpoint: '/graphql' }));

app.listen(4000, () => {

  console.log('Playground is available at http://localhost:4000/playground');
});

