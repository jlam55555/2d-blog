import numpy as np
import nltk
import os
from typing import List, Dict, Tuple
from nltk.tokenize import word_tokenize
from sklearn.manifold import TSNE as tsne
import matplotlib.pyplot as plt
import pandas as pd

nltk.download('punkt')


def tfidf(word_arr: np.array) -> np.array:
    size_doc = word_arr.shape[1]
    tf = word_arr / np.sum(word_arr, axis=0)
    # idf = size_doc / (np.sum(word_arr > 0, axis=1)[:, np.newaxis])

    # testing alternative inverse weighting scheme
    # to get rid of the most common words
    idf = np.sum(word_arr, axis=1)[:, np.newaxis] ** -1

    return tf * idf


def make_dic(docs: List[str]) -> Tuple[Dict[str, int], List[str]]:
    row_num = 0
    voc = {}
    voc_list = []
    # go thru each doc to find out total unique vocab and put them in a dictionary with row number
    for i, doc in enumerate(docs):
        with open(doc, "r") as data:
            for line in data:
                for word in word_tokenize(line.lower()):
                    if word not in voc and word.isalpha():
                        voc[word] = row_num
                        voc_list.append(word)
                        row_num += 1
    return voc, voc_list


def wordcheck(docs: List[str], voc: Dict[str, int]) -> np.array:
    dic_size = len(voc)
    ##dic_size is row, lens of doc is column
    count_arr = np.zeros((dic_size, len(docs)))
    for i, doc in enumerate(docs):
        with open(doc, "r") as data:
            for line in data:
                for word in word_tokenize(line.lower()):
                    if word in voc:
                        count_arr[voc[word], i] += 1
    return count_arr


def search_docs(word_arr: np.array,
                voc_map: Dict[str, int],
                doc_list: List[str],
                query: str) -> List[str]:
    """
    Search for documents that match the query, in sorted order

    :param word_arr:    TF-IDF matrix
    :param voc_map:     mapping from words to their index in word_arr
    :param doc_list:    mapping from index to documents in word_arr
    :param query:       word to search for
    :return:            ranked documents that include this work
    """
    word_tf_idfs = word_arr[voc_map[query], :]
    return [doc_list[doc_index]
            for doc_index in np.argsort(word_tf_idfs)
            if word_tf_idfs[doc_index] > 0][::-1]


# docs = os.listdir("corpora\\blog-posts")
# docs = ['corpora\\blog-posts\\' + path for path in doc]
docs = os.listdir("corpora/blog-posts")
docs = ['corpora/blog-posts/' + path for path in docs]
docs.sort()
dic, voc_list = make_dic(docs)
word_arr = wordcheck(docs, dic)
output = tfidf(word_arr)

# normalize columns
output = output / output.max(axis=0)

# compressing the tf-idf values
row_sums = np.sum(output, axis=1)
word_indices = np.array(np.argsort(row_sums)[-1:-101:-1])
output = output[word_indices, :]
voc_list = [voc_list[i] for i in word_indices]
dic = {}
for i, word in enumerate(voc_list):
    dic[word] = i

pd.DataFrame(data=output, index=voc_list, columns=docs) \
    .to_csv('tf_idf_matrix.csv')

# print(search_docs(output, dic, docs, 'veikk'))

embedded_output = tsne().fit_transform(output.T)
plt.scatter(embedded_output[:, 0], embedded_output[:, 1])
plt.show()

for doc in ['button-mapping-journeys', 'veikk-linux-driver-v3-notes', 'on-developing-a-linux-driver', 'code-opinions']:
    print(embedded_output[docs.index('corpora/blog-posts/' + doc + '.txt'), :])

# print([docs[doc_index] for doc_index in np.argwhere(embedded_output[:, 0] > 300).flatten()])

# voc_list = [voc_list[i] for i in np.argsort(output[:, 1])]
# output = output[np.argsort(output[:,1])]
# for i,x in enumerate(output):
#   print(voc_list[i], end = ": ")
#   for y in x:
#     print(y, end = " ")
#
#   print ("")
