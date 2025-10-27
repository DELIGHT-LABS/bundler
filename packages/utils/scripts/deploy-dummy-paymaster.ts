import { Command } from 'commander'
import { ethers } from 'hardhat'
import { getEntryPointAddress } from '@account-abstraction/utils'
import { formatEther, parseEther } from 'ethers/lib/utils'

const program = new Command()
  .version('1.0.0')
  .option('--network <string>', 'Network to use', 'localhost')
  .option('--fund <amount>', 'Amount to fund paymaster (in ETH)', '1')
  .option('--stake <amount>', 'Amount to stake (in ETH)', '0.1')

async function deployDummyPaymaster (): Promise<string> {
  console.log('=== DummyPaymaster 배포 시작 ===')

  const entryPointAddress = getEntryPointAddress()
  console.log('EntryPoint 주소:', entryPointAddress)

  const DummyPaymaster = await ethers.getContractFactory('DummyPaymaster')

  // DummyPaymaster 배포
  console.log('DummyPaymaster 배포 중...')
  const paymaster = await DummyPaymaster.deploy(entryPointAddress, {
    gasLimit: 3e6
  })

  await paymaster.deployed()
  console.log('✅ DummyPaymaster 배포 완료!')
  console.log('Paymaster 주소:', paymaster.address)

  return paymaster.address
}

async function fundPaymaster (paymasterAddress: string, amount: string): Promise<void> {
  console.log('\n=== Paymaster 자금 조달 ===')
  console.log(`Paymaster 주소: ${paymasterAddress}`)
  console.log(`입금 금액: ${amount} ETH`)

  const paymaster = await ethers.getContractAt('DummyPaymaster', paymasterAddress)
  const depositAmount = parseEther(amount)

  // 현재 잔액 확인
  const currentDeposit = await paymaster.getDeposit()
  console.log('현재 deposit:', formatEther(currentDeposit), 'ETH')

  // 자금 조달
  console.log('자금 조달 중...')
  const tx = await paymaster.deposit({ value: depositAmount })
  await tx.wait()

  const newDeposit = await paymaster.getDeposit()
  console.log('✅ 자금 조달 완료!')
  console.log('새로운 deposit:', formatEther(newDeposit), 'ETH')
}

async function stakePaymaster (paymasterAddress: string, amount: string): Promise<void> {
  console.log('\n=== Paymaster Stake 추가 ===')
  console.log(`Stake 금액: ${amount} ETH`)

  const paymaster = await ethers.getContractAt('DummyPaymaster', paymasterAddress)
  const stakeAmount = parseEther(amount)

  console.log('Stake 추가 중...')
  const tx = await paymaster.addStake(1n, { value: stakeAmount })
  await tx.wait()

  console.log('✅ Stake 추가 완료!')
}

async function checkPaymasterStatus (paymasterAddress: string): Promise<void> {
  console.log('\n=== Paymaster 상태 확인 ===')

  const paymaster = await ethers.getContractAt('DummyPaymaster', paymasterAddress)
  const entryPoint = await ethers.getContractAt('IEntryPoint', await paymaster.entryPoint())

  const deposit = await paymaster.getDeposit()
  const stake = await entryPoint.balanceOf(paymasterAddress)

  console.log('Paymaster 정보:')
  console.log('- 주소:', paymasterAddress)
  console.log('- EntryPoint:', await paymaster.entryPoint())
  console.log('- Deposit:', formatEther(deposit), 'ETH')
  console.log('- Stake:', formatEther(stake), 'ETH')
}

async function main (): Promise<void> {
  const opts = program.parse().opts()

  try {
    // DummyPaymaster 배포
    const paymasterAddress = await deployDummyPaymaster()

    // 자금 조달
    if (parseFloat(opts.fund) > 0) {
      await fundPaymaster(paymasterAddress, opts.fund)
    }

    // Stake 추가
    if (parseFloat(opts.stake) > 0) {
      await stakePaymaster(paymasterAddress, opts.stake)
    }

    // 상태 확인
    await checkPaymasterStatus(paymasterAddress)

    console.log('\n🎉 DummyPaymaster 설정 완료!')
    console.log('이제 이 Paymaster를 사용하여 UserOperation을 테스트할 수 있습니다.')
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
