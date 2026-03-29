export const vrdgaDeployerAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_collection', type: 'address', internalType: 'address' },
      { name: '_metadata', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'collection',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deploy',
    inputs: [
      {
        name: 'deployments',
        type: 'tuple[]',
        internalType: 'struct PixieVRDGADeployer.Deployment[]',
        components: [
          { name: 'pieceId', type: 'uint256', internalType: 'uint256' },
          { name: 'startTime', type: 'uint256', internalType: 'uint256' },
          { name: 'endTime', type: 'uint256', internalType: 'uint256' },
          { name: 'maxMints', type: 'uint256', internalType: 'uint256' },
          { name: 'targetPrice', type: 'uint256', internalType: 'uint256' },
          { name: 'priceDecay', type: 'uint256', internalType: 'uint256' },
          { name: 'perTimeUnit', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'metadata',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VRDGADeployed',
    inputs: [
      {
        name: 'contractAddress',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'pieceId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'startTime',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'endTime',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
] as const;
