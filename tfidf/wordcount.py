import numpy as np
import nltk
import os
from nltk.tokenize import  word_tokenize
nltk.download('punkt')

def tfidf(dic, doc, word_arr):
  size_doc = len(doc)

  tf = word_arr / np.sum(word_arr, axis = 0)

  idf = size_doc / (np.sum(word_arr > 0, axis = 1)[:, np.newaxis])
  
  return tf*idf

def make_dic(doc):
  row_num = 0
  voc = dict()
  voc_list = list()
  # go thru each doc to find out total unique vocab and put them in a dictionary with row number
  for i in range(len(doc)): 
    with open(doc[i],"r") as data:
      for line in data: 
        curr = word_tokenize(line.lower())
        for word in curr:
          if (word not in voc) and (word.isalpha()):
            voc[word] = row_num
            voc_list.append(word)
            row_num += 1
  return voc, voc_list

def wordcheck(doc,voc):
  dic_size = len(voc)
  ##dic_size is row, lens of doc is column
  count_arr = np.zeros((dic_size, len(doc)))
  for i in range(len(doc)):
    with open(doc[i],"r") as data:
      for line in data:
        words = word_tokenize(line.lower())
        for word in words:
          if word in voc:
            count_arr[voc[word], i] += 1
  return count_arr

doc = os.listdir("corpora\\blog-posts")
doc = ['corpora\\blog-posts\\' + path for path in doc]
doc.sort()
dic, voc_list = make_dic (doc)
word_arr = wordcheck(doc, dic)
output = tfidf(dic,doc, word_arr)
voc_list = [voc_list[i] for i in np.argsort(output[:,1])]
output = output[np.argsort(output[:,1])]
for i,x in enumerate(output):
  print(voc_list[i], end = ": ")
  for y in x:
    print(y, end = " ") 

  print ("")