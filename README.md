# 2d-blog
Blog with 2D navigation

### TODO:
End goal: create a model that gives a document an (x, y) coordinate

TODO:
- get all of the files
- create a model that generates a vector for each document (which can be used for document similarity)
- project onto 2D space? use t-SNE from sklearn?

```
    school,coding
          ^
          |
0     <---+---> sports
          |
          v
         tech
         
TF-IDF: (term-frequency) times (inverse document frequency)

TFIDF("hello") = TF * IDF

count("entropy" in document)       number of documents
--------------------------    * ------------------------------------------
count(all words in document)     number of documents containing this word
```
         
3D optional
