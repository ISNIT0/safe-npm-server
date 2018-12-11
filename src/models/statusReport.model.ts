import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StatusReport extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() packageName: string;
    @Column() version: string;
    @Column() automaticTestStatus: 'created' | 'started' | 'failed' | 'passed' | 'cancelled';
    @Column({ nullable: true }) automaticTestCompletedAt: Date;
    @Column({ nullable: true }) override: 'A' | 'B' | 'C' | 'D' | 'F';
}