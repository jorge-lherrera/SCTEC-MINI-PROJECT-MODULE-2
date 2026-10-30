import { Module } from '@nestjs/common';
import { TransactionRunner } from '../database/transaction-runner';

@Module({
  providers: [TransactionRunner],
  exports: [TransactionRunner],
})
export class TransactionModule {}
