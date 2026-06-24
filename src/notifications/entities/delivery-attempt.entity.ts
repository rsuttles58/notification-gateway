import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AttemptResult } from '../enums';
import { Notification } from './notification.entity';

@Entity('delivery_attempts')
export class DeliveryAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Notification, (n) => n.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ name: 'attempt_number' })
  attemptNumber: number;

  @Column({ type: 'enum', enum: AttemptResult })
  result: AttemptResult;

  @Column({ name: 'provider_response', type: 'text', nullable: true })
  providerResponse: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
