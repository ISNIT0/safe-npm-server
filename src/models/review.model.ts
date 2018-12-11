import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { PackageVersion } from './packageVersion.model';

@Entity()
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column() grade: 'A' | 'B' | 'C' | 'D' | 'F';
    @Column() reviewer: string;
    @Column() comments: string;
    @Column() createdAt: Date;
    @ManyToOne(type => PackageVersion) packageVersion: PackageVersion;
}