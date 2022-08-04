#Model

### Format
Currently, in machine learning, frameworks are used for training, execution, 
and storage of models. Because we need to quickly and without errors perform many complex 
operations and it is impossible for a small team to offer a good solution, 
so all the work with the model is implemented in the framework. 

For style transfer effect, we use a framework that has the following model storage format
```bash
├── assets
├── saved_model.pb
└── variables
    ├── variables.data-00000-of-00002
    ├── variables.data-00001-of-00002
    └── variables.index
```
assets -  directory contains files used by the TensorFlow graph, for example text files used to initialize vocabulary tables. It is unused in this example.
variables - directory contains a standard training checkpoint
saved_model.pb - file stores the actual TensorFlow program, or model, and a set of named signatures, each identifying a function that accepts tensor inputs and produces tensor outputs.
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

Use this date for filling configs/cfg_style_transfer.json

## Setting up
### Make sure python 3.8 is installed

### Create .env file in `backend` directory (see `env.example`)

```shell
cd backend
pip install poetry==1.1.11
poetry install
```

# Running project locally
```shell
cd style_transfer
poetry run python main.py
```

# Documentation 

http://localhost:8001/docs

## docker 

located in folder style_transfer

```
docker build --rm -t donft-backend:latest .

docker run --env-file .env --rm  -p 2800:2800 --name donft-backend donft-backend:latest 
```