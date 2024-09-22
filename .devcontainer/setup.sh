sudo apt update

# install docker
sudo apt install -y docker.io
HOST_DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)
CONTAINER_DOCKER_GID=$(getent group docker | cut -d: -f3)
sudo groupmod -g $HOST_DOCKER_GID docker
sudo usermod -aG docker $USER

# install gh cli
(type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
	&& sudo mkdir -p -m 755 /etc/apt/keyrings \
	&& wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
	&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
	&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
	&& sudo apt update \
	&& sudo apt install gh -y

# install act
mkdir -p ~/.act
curl -o ~/.act/act.tar.gz -LO https://github.com/nektos/act/releases/latest/download/act_Linux_x86_64.tar.gz
tar xvf ~/.act/act.tar.gz -C ~/.act
sudo mv ~/.act/act /usr/local/bin/act
rm -rf ~/.act
