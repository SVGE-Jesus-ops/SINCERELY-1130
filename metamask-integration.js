// SINCERELY MetaMask SDK Integration
// Enhanced integration for SINCERELY dApp with $NC token and NFT support

class SINCERELYMetaMask {
  constructor() {
    this.provider = null;
    this.accounts = [];
    this.chainId = null;
    this.tokenContractAddress = '0x0000000000000000000000000000000000000000'; // Replace with actual $NC token address
    this.nftContractAddress = '0x0000000000000000000000000000000000000000'; // Replace with actual NFT contract address
    this.tokenABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function allowance(address owner, address spender) view returns (uint256)'
    ];
    this.nftABI = [
      'function mint(address to, string uri) returns (uint256)',
      'function balanceOf(address owner) view returns (uint256)',
      'function tokenURI(uint256 tokenId) view returns (string)'
    ];
  }

  // Initialize MetaMask SDK
  async initialize() {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this dApp.');
      }
      this.provider = window.ethereum;
      this.setupEventListeners();
      console.log('MetaMask SDK initialized successfully');
      return { success: true, message: 'MetaMask initialized' };
    } catch (error) {
      console.error('MetaMask initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Connect wallet
  async connectWallet() {
    try {
      if (!this.provider) {
        await this.initialize();
      }
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      this.accounts = accounts;
      this.chainId = await this.provider.request({ method: 'eth_chainId' });
      console.log('Wallet connected:', accounts[0]);
      return { success: true, account: accounts[0], chainId: this.chainId };
    } catch (error) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        return { success: false, error: 'User rejected the connection request' };
      }
      return { success: false, error: error.message };
    }
  }

  // Disconnect wallet
  disconnectWallet() {
    this.accounts = [];
    this.chainId = null;
    console.log('Wallet disconnected');
    return { success: true, message: 'Wallet disconnected' };
  }

  // Get current account
  getCurrentAccount() {
    return this.accounts.length > 0 ? this.accounts[0] : null;
  }

  // Check $NC token balance
  async getTokenBalance(address = null) {
    try {
      const targetAddress = address || this.getCurrentAccount();
      if (!targetAddress) {
        throw new Error('No wallet address provided');
      }
      const contract = new ethers.Contract(this.tokenContractAddress, this.tokenABI, this.provider);
      const balance = await contract.balanceOf(targetAddress);
      const formattedBalance = ethers.utils.formatEther(balance);
      console.log('Token balance:', formattedBalance, '$NC');
      return { success: true, balance: formattedBalance, raw: balance.toString() };
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Transfer $NC tokens
  async transferTokens(toAddress, amount) {
    try {
      if (!this.getCurrentAccount()) {
        throw new Error('Wallet not connected');
      }
      const signer = this.provider.getSigner();
      const contract = new ethers.Contract(this.tokenContractAddress, this.tokenABI, signer);
      const amountInWei = ethers.utils.parseEther(amount.toString());
      const tx = await contract.transfer(toAddress, amountInWei);
      console.log('Transfer transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transfer confirmed:', receipt.transactionHash);
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      console.error('Token transfer error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mint NFT
  async mintNFT(metadataURI) {
    try {
      if (!this.getCurrentAccount()) {
        throw new Error('Wallet not connected');
      }
      const signer = this.provider.getSigner();
      const contract = new ethers.Contract(this.nftContractAddress, this.nftABI, signer);
      const tx = await contract.mint(this.getCurrentAccount(), metadataURI);
      console.log('NFT mint transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('NFT minted successfully:', receipt.transactionHash);
      return { success: true, txHash: receipt.transactionHash, receipt };
    } catch (error) {
      console.error('NFT minting error:', error);
      return { success: false, error: error.message };
    }
  }

  // Purchase music with $NC tokens
  async purchaseMusic(musicId, price) {
    try {
      if (!this.getCurrentAccount()) {
        throw new Error('Wallet not connected');
      }
      // Check balance first
      const balanceResult = await this.getTokenBalance();
      if (!balanceResult.success || parseFloat(balanceResult.balance) < parseFloat(price)) {
        throw new Error('Insufficient $NC token balance');
      }
      // Transfer tokens to music contract or treasury
      const transferResult = await this.transferTokens(this.tokenContractAddress, price);
      if (!transferResult.success) {
        throw new Error('Payment failed: ' + transferResult.error);
      }
      console.log('Music purchased successfully:', musicId);
      return { success: true, musicId, txHash: transferResult.txHash, price };
    } catch (error) {
      console.error('Music purchase error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get NFT balance
  async getNFTBalance(address = null) {
    try {
      const targetAddress = address || this.getCurrentAccount();
      if (!targetAddress) {
        throw new Error('No wallet address provided');
      }
      const contract = new ethers.Contract(this.nftContractAddress, this.nftABI, this.provider);
      const balance = await contract.balanceOf(targetAddress);
      console.log('NFT balance:', balance.toString());
      return { success: true, balance: balance.toString() };
    } catch (error) {
      console.error('Error fetching NFT balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Setup event listeners for account and network changes
  setupEventListeners() {
    if (!this.provider) return;

    // Account changed
    this.provider.on('accountsChanged', (accounts) => {
      console.log('Accounts changed:', accounts);
      this.accounts = accounts;
      if (accounts.length === 0) {
        console.log('User disconnected wallet');
        this.disconnectWallet();
      } else {
        console.log('Switched to account:', accounts[0]);
        window.dispatchEvent(new CustomEvent('sincerely:accountChanged', { detail: { account: accounts[0] } }));
      }
    });

    // Chain changed
    this.provider.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      this.chainId = chainId;
      window.location.reload(); // Recommended by MetaMask
    });

    // Disconnect
    this.provider.on('disconnect', (error) => {
      console.log('Provider disconnected:', error);
      this.disconnectWallet();
      window.dispatchEvent(new CustomEvent('sincerely:disconnected', { detail: { error } }));
    });

    // Connect
    this.provider.on('connect', (connectInfo) => {
      console.log('Provider connected:', connectInfo);
      this.chainId = connectInfo.chainId;
      window.dispatchEvent(new CustomEvent('sincerely:connected', { detail: connectInfo }));
    });
  }

  // Switch network
  async switchNetwork(chainId) {
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
      return { success: true, chainId };
    } catch (error) {
      console.error('Network switch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Add network
  async addNetwork(networkConfig) {
    try {
      await this.provider.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      });
      return { success: true };
    } catch (error) {
      console.error('Add network error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const sincerelyMetaMask = new SINCERELYMetaMask();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  window.sincerelyMetaMask = sincerelyMetaMask;
  window.addEventListener('load', () => {
    sincerelyMetaMask.initialize();
  });
}

export default sincerelyMetaMask;