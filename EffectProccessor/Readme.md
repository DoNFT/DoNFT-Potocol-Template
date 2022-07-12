#Model

### Format
Currently, in machine learning, frameworks are used for training, execution, 
and storage of models. Because we need to quickly and without errors perform many complex 
operations and it is impossible for a small team to offer a good solution, 
so all the work with the model is implemented in the framework. 

For the effect, we use a framework that has the following model storage format
```bash
├── assets
├── saved_model.pb
└── variables
    ├── variables.data-00000-of-00002
    ├── variables.data-00001-of-00002
    └── variables.index
```
### Download

1) Download archive from [url](https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2)
2) Unpack archive

### Upload to nft storage
1) Go to https://nft.storage/api-docs/
2) Press the button "Authorize" and enter nft token
3) Let's go to the function post/upload
4) Change Request body to \*/\*
5) Press "Try it out"
6) Press "Chose file" 
7) Chose file
8) Press Execute

Repeat all points 6-8 for all files of our model.